import { PRODUCTS, type Product } from "./data/products";

export type Cart = Record<string, number>;

const byId = new Map(PRODUCTS.map((product) => [product.id, product]));

export function getProduct(id: string): Product | undefined {
  return byId.get(id);
}

/** BR-19: upper case, first underscore replaced by a hyphen (f_compost → F-COMPOST) */
export function productCode(id: string): string {
  return id.toUpperCase().replace("_", "-");
}

/** The seedling sold for a vegetable, if the shop has one */
export function seedlingFor(vegId: string): Product | undefined {
  return PRODUCTS.find(
    (product) => product.category === "seedlings" && product.vegId === vegId
  );
}

const lkr = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  maximumFractionDigits: 0,
});

/** NFR-05: currency always in the en-LK format, whatever the UI language */
export function formatLKR(amount: number): string {
  return lkr.format(Math.round(amount));
}

export function formatNumber(value: number, maximumFractionDigits = 1): string {
  return new Intl.NumberFormat("en-LK", { maximumFractionDigits }).format(
    value
  );
}

/** BR-17 */
export function lineTotal(productId: string, qty: number): number {
  return (getProduct(productId)?.price ?? 0) * qty;
}

export function cartTotal(cart: Cart): number {
  return Object.entries(cart).reduce(
    (sum, [id, qty]) => sum + lineTotal(id, qty),
    0
  );
}

/**
 * Drops unknown product IDs and anything that is not a positive whole
 * quantity. Used on every cart that crosses a trust boundary: localStorage,
 * request bodies and stored Firestore documents.
 */
export function sanitizeCart(value: unknown): Cart {
  const cart: Cart = {};

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return cart;
  }

  for (const [id, qty] of Object.entries(value)) {
    if (byId.has(id) && Number.isInteger(qty) && qty > 0 && qty <= 999) {
      cart[id] = qty;
    }
  }

  return cart;
}

/** BR-20: for each product the larger quantity is kept */
export function mergeCarts(a: Cart, b: Cart): Cart {
  const merged: Cart = { ...a };

  for (const [id, qty] of Object.entries(b)) {
    merged[id] = Math.max(merged[id] ?? 0, qty);
  }

  return merged;
}
