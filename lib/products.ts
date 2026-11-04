import { PRODUCTS, type Product } from "./data/products";

export type Cart = Record<string, number>;

/**
 * The products on sale and everything priced from them. The server builds it
 * from the `products` table (lib/catalog-server.ts) and hands the same list
 * to the browser (contexts/catalog-context.tsx), so both sides price a cart
 * alike. Hidden products are left out: they cannot be found, shown, priced or
 * kept in a cart.
 */
export type Catalog = {
  /** Shop order: category order is applied by the shop itself */
  products: Product[];
  getProduct(id: string): Product | undefined;
  /** The seedling sold for a vegetable, if the shop has one */
  seedlingFor(vegId: string): Product | undefined;
  /** BR-17 */
  lineTotal(productId: string, qty: number): number;
  cartTotal(cart: Cart): number;
  /**
   * Drops unknown or hidden product IDs and anything that is not a positive
   * whole quantity. Used on every cart that crosses a trust boundary:
   * localStorage, request bodies and stored database rows.
   */
  sanitizeCart(value: unknown): Cart;
};

export function createCatalog(products: Product[]): Catalog {
  const byId = new Map(products.map((product) => [product.id, product]));

  const getProduct = (id: string) => byId.get(id);
  const lineTotal = (productId: string, qty: number) =>
    (byId.get(productId)?.price ?? 0) * qty;

  return {
    products,
    getProduct,
    seedlingFor: (vegId) =>
      products.find(
        (product) => product.category === "seedlings" && product.vegId === vegId
      ),
    lineTotal,
    cartTotal: (cart) =>
      Object.entries(cart).reduce((sum, [id, qty]) => sum + lineTotal(id, qty), 0),
    sanitizeCart: (value) => sanitizeQuantities(value, (id) => byId.has(id)),
  };
}

/**
 * Keeps only positive whole quantities up to 999, for products `keep`
 * accepts. Without `keep` every product ID passes - for the device cart,
 * which outlives catalogue changes and is filtered when it is read.
 */
export function sanitizeQuantities(
  value: unknown,
  keep: (id: string) => boolean = () => true
): Cart {
  const cart: Cart = {};

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return cart;
  }

  for (const [id, qty] of Object.entries(value)) {
    if (keep(id) && Number.isInteger(qty) && qty > 0 && qty <= 999) {
      cart[id] = qty;
    }
  }

  return cart;
}

/**
 * The catalogue as written in lib/data/products.ts: the seed for the
 * database, the guest-mode catalogue, and the fixture for tests.
 */
export const STATIC_CATALOG = createCatalog(PRODUCTS);

/** BR-19: upper case, first underscore replaced by a hyphen (f_compost → F-COMPOST) */
export function productCode(id: string): string {
  return id.toUpperCase().replace("_", "-");
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

/** BR-20: for each product the larger quantity is kept */
export function mergeCarts(a: Cart, b: Cart): Cart {
  const merged: Cart = { ...a };

  for (const [id, qty] of Object.entries(b)) {
    merged[id] = Math.max(merged[id] ?? 0, qty);
  }

  return merged;
}
