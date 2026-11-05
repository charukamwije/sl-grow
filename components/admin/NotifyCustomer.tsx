import type { NotifyStatus } from "@/lib/order/whatsapp";

/** Ready-made links for each update, built on the server (they need SITE_URL) */
export type NotifyLinks = Record<NotifyStatus, { whatsapp?: string; sms?: string; email?: string }>;

const button =
  "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition";
const plain = `${button} bg-white text-gray-800 ring-1 ring-gray-200 hover:bg-gray-50`;

/**
 * Tells the customer about their order's current status through the admin's
 * own WhatsApp, SMS or email app: one tap opens it with the message written.
 */
export default function NotifyCustomer({
  links,
  statusName,
}: {
  links: NotifyLinks[NotifyStatus];
  statusName: string;
}) {
  if (!links.whatsapp && !links.sms && !links.email) {
    return (
      <p className="text-xs text-gray-500">
        This order has no valid mobile number or email to send the update to.
      </p>
    );
  }

  return (
    <div className="space-y-2 rounded-2xl bg-emerald-50/60 p-3 ring-1 ring-emerald-100">
      <p className="text-sm font-medium text-gray-900">Tell the customer: {statusName}</p>
      <div className="flex flex-wrap gap-2">
        {links.whatsapp && (
          <a
            href={links.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className={`${button} bg-[#25D366] text-white hover:bg-[#1ebe5b]`}
          >
            WhatsApp
          </a>
        )}
        {links.sms && (
          <a href={links.sms} className={plain}>
            SMS
          </a>
        )}
        {links.email && (
          <a href={links.email} className={plain}>
            Email
          </a>
        )}
      </div>
    </div>
  );
}
