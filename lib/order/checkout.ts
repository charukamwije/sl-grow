/**
 * Checkout and order status, shared by the cart, the API and the admin
 * console. Orders are placed in the app by signed-in customers and paid by
 * cash on delivery (or at pickup) or by bank transfer.
 */
import type { Cart } from "../products";
import { normalizeMobile } from "./phone";

export type CheckoutMethod = "pickup" | "delivery";

export const PAYMENT_METHODS = ["cod", "bank_transfer"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type CheckoutDetails = {
  name: string;
  phone: string;
  method: CheckoutMethod;
  payment: PaymentMethod;
  address: string;
  notes: string;
};

export type CheckoutError = "nameAndPhone" | "phone" | "address" | "emptyCart";

/** FR-O-01, FR-O-02 */
export function validateCheckout(
  details: CheckoutDetails,
  cart: Cart
): CheckoutError | null {
  if (Object.keys(cart).length === 0) return "emptyCart";
  if (!details.name.trim() || !details.phone.trim()) return "nameAndPhone";
  if (!normalizeMobile(details.phone)) return "phone";
  if (details.method === "delivery" && !details.address.trim()) return "address";
  return null;
}

/** In order: an order moves forward through these, or is cancelled */
export const ORDER_STATUSES = [
  "created",
  "received",
  "out_for_delivery",
  "completed",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** The steps a customer's order page shows as a timeline */
export const ORDER_PROGRESS: OrderStatus[] = ["created", "received", "out_for_delivery", "completed"];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === "string" && (PAYMENT_METHODS as readonly string[]).includes(value);
}

/** English labels, for the admin console */
export const STATUS_LABELS: Record<OrderStatus, string> = {
  created: "Created",
  received: "Confirmed",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** A pickup order is "ready for pickup" where a delivery is "out for delivery" */
export function statusLabel(status: OrderStatus, method: CheckoutMethod): string {
  return status === "out_for_delivery" && method === "pickup"
    ? "Ready for pickup"
    : STATUS_LABELS[status];
}

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cod: "Cash on delivery",
  bank_transfer: "Bank transfer",
};

/** A bank transfer slip can still be sent while the order is open and unpaid */
export function acceptsReceipt(order: {
  payment: PaymentMethod;
  status: OrderStatus;
  paid: boolean;
}): boolean {
  return order.payment === "bank_transfer" && order.status !== "cancelled" && !order.paid;
}
