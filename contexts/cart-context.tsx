"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import { useCatalog } from "@/contexts/catalog-context";
import { mergeCarts, sanitizeQuantities, type Cart } from "@/lib/products";

export const CART_STORAGE_KEY = "hvs_cart";
const SYNC_DELAY_MS = 600;
const EMPTY_CART: Cart = {};

/**
 * The device cart, kept in localStorage (FR-C-03) and read through
 * `useSyncExternalStore`: the server render and the first client render both
 * see an empty cart, and the stored one appears right after hydration without
 * a mismatch. Other tabs' changes arrive through the `storage` event.
 *
 * The store keeps any product ID; the provider shows only those on sale. A
 * product the shop hides drops out of the cart, and comes back if it is
 * shown again.
 */
const deviceCart = (() => {
  // The parsed cart is cached against the raw stored string, so snapshots
  // stay referentially stable until the stored value actually changes
  let memory: Cart = EMPTY_CART;
  let lastRaw: string | null | undefined;
  const listeners = new Set<() => void>();

  const notify = () => listeners.forEach((listener) => listener());

  const onStorage = (event: StorageEvent) => {
    if (event.key === CART_STORAGE_KEY) notify();
  };

  return {
    get(): Cart {
      let raw: string | null;
      try {
        raw = localStorage.getItem(CART_STORAGE_KEY);
      } catch {
        return memory;
      }
      if (raw !== lastRaw) {
        lastRaw = raw;
        try {
          memory = sanitizeQuantities(JSON.parse(raw ?? "{}"));
        } catch {
          memory = {};
        }
      }
      return memory;
    },
    set(cart: Cart) {
      memory = cart;
      try {
        const raw = JSON.stringify(cart);
        localStorage.setItem(CART_STORAGE_KEY, raw);
        lastRaw = raw;
      } catch {
        // Private mode or full storage: the cart still works for this visit
      }
      notify();
    },
    subscribe(listener: () => void) {
      if (listeners.size === 0) window.addEventListener("storage", onStorage);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          window.removeEventListener("storage", onStorage);
        }
      };
    },
  };
})();

type CartContextType = {
  cart: Cart;
  /** Total number of items, for the badge next to the Cart tab */
  count: number;
  add: (productId: string, qty?: number) => void;
  addMany: (lines: { productId: string; qty: number }[]) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  /** After an order is placed; the sync then empties the cloud cart too */
  clear: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

async function sendCart(url: string, method: "POST" | "PUT", cart: Cart) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cart }),
  });
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || "Cart sync failed.");
  }

  return sanitizeQuantities(data.cart);
}

/**
 * With a signed-in `uid` the cart is also kept in the customer's account:
 * merged with the cloud cart once per sign-in or page load (BR-20), then
 * saved after every change (FR-A-04). Signing out leaves the device cart
 * alone (FR-A-09).
 */
export const CartProvider = ({
  children,
  uid,
}: {
  children: ReactNode;
  uid: string | null;
}) => {
  const { sanitizeCart } = useCatalog();
  const stored = useSyncExternalStore(
    deviceCart.subscribe,
    deviceCart.get,
    () => EMPTY_CART
  );
  const cart = useMemo(() => sanitizeCart(stored), [stored, sanitizeCart]);

  // The uid whose cloud cart has been merged in. Changes are pushed only
  // after that, so a device cart can never overwrite the cloud one unmerged.
  const mergedUid = useRef<string | null>(null);
  const lastSynced = useRef("");

  useEffect(() => {
    if (!uid) {
      mergedUid.current = null;
      return;
    }
    if (mergedUid.current === uid) return;

    let cancelled = false;

    sendCart("/api/cart/merge", "POST", deviceCart.get())
      .then((merged) => {
        if (cancelled) return;
        mergedUid.current = uid;
        lastSynced.current = JSON.stringify(merged);
        // Anything added while the request was in flight is kept too; if
        // that differs from the cloud copy, the push below sends it
        deviceCart.set(mergeCarts(merged, deviceCart.get()));
      })
      .catch((error) => console.error("Cart merge error:", error));

    return () => {
      cancelled = true;
    };
  }, [uid]);

  useEffect(() => {
    if (!uid || mergedUid.current !== uid) return;

    const serialized = JSON.stringify(cart);
    if (serialized === lastSynced.current) return;

    const timer = setTimeout(() => {
      sendCart("/api/cart", "PUT", cart)
        .then(() => {
          lastSynced.current = serialized;
        })
        .catch((error) => console.error("Cart save error:", error));
    }, SYNC_DELAY_MS);

    return () => clearTimeout(timer);
  }, [cart, uid]);

  const setQty = useCallback((productId: string, qty: number) => {
    const next = { ...deviceCart.get() };
    if (qty > 0) next[productId] = Math.min(Math.floor(qty), 999);
    else delete next[productId];
    deviceCart.set(next);
  }, []);

  const addMany = useCallback(
    (lines: { productId: string; qty: number }[]) => {
      const next = { ...deviceCart.get() };
      for (const { productId, qty } of lines) {
        next[productId] = Math.min((next[productId] ?? 0) + qty, 999);
      }
      deviceCart.set(next);
    },
    []
  );

  const add = useCallback(
    (productId: string, qty = 1) => addMany([{ productId, qty }]),
    [addMany]
  );

  const remove = useCallback(
    (productId: string) => setQty(productId, 0),
    [setQty]
  );

  const clear = useCallback(() => deviceCart.set({}), []);

  const value = useMemo(
    () => ({
      cart,
      count: Object.values(cart).reduce((sum, qty) => sum + qty, 0),
      add,
      addMany,
      setQty,
      remove,
      clear,
    }),
    [cart, add, addMany, setQty, remove, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
