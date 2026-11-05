import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { NotifyLinks } from "@/components/admin/NotifyCustomer";
import OrderStatusControls from "@/components/admin/OrderStatusControls";
import LocalTime from "@/components/ui/LocalTime";
import { btnGhost, card, heading, muted, subheading } from "@/components/ui/styles";
import { getAdminOrder, type AdminOrder } from "@/lib/admin-orders";
import { PAYMENT_LABELS, STATUS_LABELS } from "@/lib/order/checkout";
import { formatMobile, normalizeMobile } from "@/lib/order/phone";
import {
  buildCustomerStatusMessage,
  mailtoLink,
  NOTIFY_STATUSES,
  smsLink,
  waLink,
} from "@/lib/order/whatsapp";
import { receiptSignedUrl } from "@/lib/receipts";
import { formatLKR } from "@/lib/products";
import { requireRole } from "@/lib/supabase/admin-auth";

export const metadata: Metadata = { title: "Order" };

// One-tap updates for the customer, one per status worth telling them about
function notifyLinks(order: AdminOrder): NotifyLinks {
  const mobile = normalizeMobile(order.phone);
  return Object.fromEntries(
    NOTIFY_STATUSES.map((status) => {
      const message = buildCustomerStatusMessage(order, status);
      return [
        status,
        {
          whatsapp: mobile ? waLink(message, mobile) : undefined,
          sms: mobile ? smsLink(mobile, message) : undefined,
          email: order.accountEmail
            ? mailtoLink(order.accountEmail, `Your Aswedduma order ${order.ref ?? ""}`.trim(), message)
            : undefined,
        },
      ];
    })
  ) as NotifyLinks;
}

export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");

  const order = await getAdminOrder((await params).id);
  if (!order) notFound();

  const receiptUrl = order.receiptPath ? await receiptSignedUrl(order.receiptPath) : null;
  const receiptIsPdf = order.receiptPath?.endsWith(".pdf") ?? false;

  const details: [string, string][] = [
    ["Name", order.name],
    ["Phone", formatMobile(order.phone)],
    ["Method", order.method === "delivery" ? "Delivery" : "Pickup"],
    ["Payment", PAYMENT_LABELS[order.payment]],
    ...(order.method === "delivery" ? ([["Address", order.address || "None given"]] as [string, string][]) : []),
    ["Notes", order.notes || "None"],
    ["Account", order.accountEmail ?? "Account deleted"],
  ];

  return (
    <>
      <Link href="/admin/orders" className={btnGhost}>
        ← Orders
      </Link>
      <div>
        <h1 className={`${heading} font-mono`}>{order.ref ?? "Order"}</h1>
        <p className={muted}>
          <LocalTime value={order.createdAt} /> · Prices as
          they were when the order was placed
        </p>
      </div>

      <section className={`${card} space-y-3`}>
        <h2 className={`${subheading} !mb-0`}>Status</h2>
        <OrderStatusControls
          id={order.id}
          status={order.status}
          method={order.method}
          paid={order.paid}
          notify={notifyLinks(order)}
        />
        <p className="text-xs text-gray-500">
          {order.statusUpdatedAt ? (
            <>
              Status last changed <LocalTime value={order.statusUpdatedAt} />
            </>
          ) : (
            `${STATUS_LABELS.created} when placed`
          )}
          {order.paidAt && (
            <>
              {" "}
              · Marked paid <LocalTime value={order.paidAt} />
            </>
          )}
        </p>
      </section>

      {order.payment === "bank_transfer" && (
        <section className={`${card} space-y-3`}>
          <h2 className={`${subheading} !mb-0`}>Transfer slip</h2>
          {!order.receiptPath ? (
            <p className={muted}>The customer has not uploaded a slip yet.</p>
          ) : !receiptUrl ? (
            <p className="text-sm text-red-700">The slip could not be opened. Reload the page to try again.</p>
          ) : (
            <>
              <p className={muted}>
                Uploaded {order.receiptUploadedAt && <LocalTime value={order.receiptUploadedAt} />}. Check
                the bank for a transfer with the reference {order.ref}, then set the payment to Paid.
                The link below works for 10 minutes.
              </p>
              {receiptIsPdf ? (
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-emerald-700 hover:underline"
                >
                  Open the slip (PDF)
                </a>
              ) : (
                <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={receiptUrl}
                    alt={`Transfer slip for ${order.ref}`}
                    className="max-h-[28rem] rounded-2xl ring-1 ring-black/10"
                  />
                </a>
              )}
            </>
          )}
        </section>
      )}

      <section className={card}>
        <h2 className={subheading}>Customer</h2>
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[8rem_1fr]">
          {details.map(([term, value]) => (
            <div key={term} className="contents">
              <dt className="text-gray-500">{term}</dt>
              <dd className="whitespace-pre-wrap text-gray-900">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4">
          <a
            href={`tel:${order.phone.replace(/[^\d+]/g, "")}`}
            className="text-sm font-medium text-emerald-700 hover:underline"
          >
            Call {formatMobile(order.phone)}
          </a>
        </p>
      </section>

      <section className={`${card} overflow-x-auto`}>
        <h2 className={subheading}>Items</h2>
        <table className="w-full min-w-[30rem] text-left text-sm">
          <thead className="border-b border-black/5 text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="py-2 pr-4 font-semibold">Product</th>
              <th className="py-2 pr-4 text-right font-semibold">Price</th>
              <th className="py-2 pr-4 text-right font-semibold">Qty</th>
              <th className="py-2 text-right font-semibold">Line total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {order.items.map((item) => (
              <tr key={item.code}>
                <td className="py-2 pr-4">
                  <code className="text-xs text-gray-500">{item.code}</code> {item.name}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums">{formatLKR(item.price)}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{item.qty}</td>
                <td className="py-2 text-right tabular-nums">{formatLKR(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-black/10">
              <td colSpan={3} className="py-2 pr-4 text-right font-semibold">
                Total before delivery
              </td>
              <td className="py-2 text-right font-bold tabular-nums">{formatLKR(order.total)}</td>
            </tr>
          </tfoot>
        </table>
      </section>
    </>
  );
}
