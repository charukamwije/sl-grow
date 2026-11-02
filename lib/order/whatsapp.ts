/**
 * WhatsApp message builders. Order text is always English whatever language
 * the customer uses (FR-O-05), so the shop reads every order the same way.
 */
import { OWNER_WHATSAPP } from "../shop-config";
import {
  cartTotal,
  formatLKR,
  getProduct,
  lineTotal,
  productCode,
  type Cart,
} from "../products";

export type CheckoutMethod = "pickup" | "delivery";

export type CheckoutDetails = {
  name: string;
  phone: string;
  method: CheckoutMethod;
  address: string;
  notes: string;
};

export type CheckoutError = "nameAndPhone" | "address" | "emptyCart";

/** FR-O-01, FR-O-02 */
export function validateCheckout(
  details: CheckoutDetails,
  cart: Cart
): CheckoutError | null {
  if (Object.keys(cart).length === 0) return "emptyCart";
  if (!details.name.trim() || !details.phone.trim()) return "nameAndPhone";
  if (details.method === "delivery" && !details.address.trim()) return "address";
  return null;
}

/** FR-O-04 */
export function buildOrderMessage(details: CheckoutDetails, cart: Cart): string {
  const lines = [
    "New order - Home Veggie Shop",
    "",
    `Name: ${details.name.trim()}`,
    `Phone: ${details.phone.trim()}`,
    `Method: ${details.method === "delivery" ? "Delivery" : "Pickup"}`,
  ];

  if (details.method === "delivery") {
    lines.push(`Address: ${details.address.trim()}`);
  }

  lines.push("", "Items:");

  for (const [id, qty] of Object.entries(cart)) {
    const product = getProduct(id);
    if (!product) continue;
    lines.push(
      `- [${productCode(id)}] ${product.name.en} x ${qty} = ${formatLKR(lineTotal(id, qty))}`
    );
  }

  lines.push("", `Total before delivery: ${formatLKR(cartTotal(cart))}`);

  if (details.notes.trim()) {
    lines.push("", `Notes: ${details.notes.trim()}`);
  }

  return lines.join("\n");
}

/** FR-I-07 */
export function buildEnquiryMessage(
  cropName: string,
  hectares: number,
  acres: number
): string {
  return [
    "Plantation enquiry - Home Veggie Shop",
    "",
    `Crop: ${cropName}`,
    `Land size: ${hectares.toFixed(2)} ha (${acres.toFixed(2)} acres)`,
    "",
    "Please contact me about planting material and setup.",
  ].join("\n");
}

export function waLink(message: string, number: string = OWNER_WHATSAPP): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
