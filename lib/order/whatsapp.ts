/**
 * WhatsApp message builders for plantation enquiries, always in English
 * whatever language the customer uses, so the shop reads every message the
 * same way. Orders and certification applications are made in the app
 * instead (lib/order/checkout.ts, lib/certification/status.ts).
 */
import { OWNER_WHATSAPP } from "../shop-config";

/** FR-I-07 */
export function buildEnquiryMessage(
  cropName: string,
  hectares: number,
  acres: number
): string {
  return [
    "Plantation enquiry - Aswedduma",
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
