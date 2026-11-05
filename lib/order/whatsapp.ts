/**
 * WhatsApp message builders, always in English: plantation enquiries sent to
 * the shop, and order updates an admin sends a customer with one tap (the
 * shop has no messaging provider, so the admin's own WhatsApp, SMS or email
 * app sends them). Orders and certification applications are made in the app
 * (lib/order/checkout.ts, lib/certification/status.ts).
 */
import { formatLKR } from "../products";
import { OWNER_WHATSAPP_DISPLAY, OWNER_WHATSAPP } from "../shop-config";
import { SITE_NAME, SITE_URL } from "../site";
import type { CheckoutMethod, OrderStatus, PaymentMethod } from "./checkout";

/** FR-I-07 */
export function buildEnquiryMessage(
  cropName: string,
  hectares: number,
  acres: number,
  district?: string
): string {
  return [
    "Plantation enquiry - Aswedduma",
    "",
    `Crop: ${cropName}`,
    `Land size: ${hectares.toFixed(2)} ha (${acres.toFixed(2)} acres)`,
    ...(district ? [`District: ${district}`] : []),
    "",
    "Please contact me about planting material and setup.",
  ].join("\n");
}

export function waLink(message: string, number: string = OWNER_WHATSAPP): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export type NotifyOrder = {
  id: string;
  ref: string | null;
  name: string;
  method: CheckoutMethod;
  payment: PaymentMethod;
  paid: boolean;
  total: number;
};

/** The statuses worth telling a customer about */
export const NOTIFY_STATUSES = ["received", "out_for_delivery", "completed"] as const;

export type NotifyStatus = (typeof NOTIFY_STATUSES)[number];

export function isNotifyStatus(status: OrderStatus): status is NotifyStatus {
  return (NOTIFY_STATUSES as readonly string[]).includes(status);
}

/** The update for a customer whose order just reached `status` */
export function buildCustomerStatusMessage(order: NotifyOrder, status: NotifyStatus): string {
  const ref = order.ref ?? "your order";
  const pickup = order.method === "pickup";
  const unpaid = !order.paid;

  const body: Record<NotifyStatus, string[]> = {
    received: [
      `Your order ${ref} is confirmed. Total ${formatLKR(order.total)}.`,
      pickup
        ? "We will message you again when it is ready for pickup."
        : "We will message you again when it is out for delivery.",
      ...(unpaid && order.payment === "bank_transfer"
        ? [`Please pay by bank transfer with the reference ${ref} and upload the slip on the order page.`]
        : []),
    ],
    out_for_delivery: pickup
      ? [
          `Your order ${ref} is ready for pickup.`,
          ...(unpaid ? [`Please bring ${formatLKR(order.total)} when you come.`] : []),
        ]
      : [
          `Your order ${ref} is out for delivery and will reach you soon.`,
          ...(unpaid && order.payment === "cod"
            ? [`Please keep ${formatLKR(order.total)} ready for cash on delivery.`]
            : []),
        ],
    completed: [
      pickup
        ? `Thank you for picking up your order ${ref}.`
        : `Your order ${ref} has been delivered. Thank you!`,
      "Happy growing! Reply here if anything is not right.",
    ],
  };

  return [
    `Hello ${order.name},`,
    "",
    ...body[status],
    "",
    `Order: ${SITE_URL}/account/orders/${order.id}`,
    `${SITE_NAME} · ${OWNER_WHATSAPP_DISPLAY}`,
  ].join("\n");
}

export function smsLink(number: string, message: string): string {
  return `sms:+${number}?body=${encodeURIComponent(message)}`;
}

export function mailtoLink(email: string, subject: string, message: string): string {
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
}
