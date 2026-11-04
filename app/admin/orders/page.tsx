import type { Metadata } from "next";
import Link from "next/link";
import { btnPrimary, btnSecondary, card, heading, input, label, muted } from "@/components/ui/styles";
import { listAdminOrders, ORDERS_PER_PAGE } from "@/lib/admin-orders";
import { ORDER_STATUSES, STATUS_LABELS } from "@/lib/order/checkout";
import { orderFiltersQuery, parseOrderFilters } from "@/lib/order-filters";
import { formatLKR } from "@/lib/products";
import { requireRole } from "@/lib/supabase/admin-auth";

export const metadata: Metadata = { title: "Orders" };

// ISO timestamps are UTC; slicing keeps server and client output identical
function formatDate(value: string): string {
  return `${value.slice(0, 16).replace("T", " ")} UTC`;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole("admin");

  const filters = parseOrderFilters(await searchParams);
  const { orders, total } = await listAdminOrders(filters);

  const pages = Math.max(1, Math.ceil(total / ORDERS_PER_PAGE));
  const filtered = Boolean(
    filters.q || filters.from || filters.to || filters.status || filters.payment
  );

  return (
    <>
      <div>
        <h1 className={heading}>Orders</h1>
        <p className={muted}>
          Every order, newest first. Open one to move it through its status and mark it
          paid. Orders themselves cannot be edited or deleted.
        </p>
      </div>

      <form className={`${card} grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto] lg:items-end`} role="search">
        <div>
          <label htmlFor="q" className={label}>
            Reference, phone or name
          </label>
          <input
            id="q"
            type="search"
            name="q"
            defaultValue={filters.q}
            placeholder="e.g. ASW-7K3P9Q"
            className={input}
          />
        </div>
        <div>
          <label htmlFor="from" className={label}>
            From (UTC)
          </label>
          <input id="from" type="date" name="from" defaultValue={filters.from ?? ""} className={input} />
        </div>
        <div>
          <label htmlFor="to" className={label}>
            To (UTC)
          </label>
          <input id="to" type="date" name="to" defaultValue={filters.to ?? ""} className={input} />
        </div>
        <div>
          <label htmlFor="status" className={label}>
            Status
          </label>
          <select id="status" name="status" defaultValue={filters.status ?? ""} className={input}>
            <option value="">Any status</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="payment" className={label}>
            Payment
          </label>
          <select id="payment" name="payment" defaultValue={filters.payment ?? ""} className={input}>
            <option value="">Paid or unpaid</option>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
            <option value="receipt">Slip waiting to be checked</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className={btnPrimary}>
            Search
          </button>
          {filtered && (
            <Link href="/admin/orders" className={btnSecondary}>
              Clear
            </Link>
          )}
        </div>
      </form>

      <p className={muted}>
        {total === 0
          ? filtered
            ? "No orders match."
            : "No orders yet."
          : `${total} order${total === 1 ? "" : "s"}${filtered ? " match" : ""}.`}
      </p>

      {orders.length > 0 && (
        <div className={`${card} overflow-x-auto p-0 sm:p-0`}>
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-black/5 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Reference</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 text-right font-semibold">Items</th>
                <th className="px-4 py-3 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-mono text-xs font-bold tracking-wider text-emerald-800 hover:underline"
                    >
                      {order.ref ?? "No reference"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <time dateTime={order.createdAt}>{formatDate(order.createdAt)}</time>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{order.name}</p>
                    <p className="text-xs text-gray-500">{order.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        order.status === "created"
                          ? "bg-sky-50 text-sky-800"
                          : order.status === "cancelled"
                            ? "bg-gray-100 text-gray-600"
                            : order.status === "completed"
                              ? "bg-emerald-50 text-emerald-800"
                              : "bg-amber-50 text-amber-800"
                      }`}
                    >
                      {STATUS_LABELS[order.status]}
                    </span>
                    <p className="mt-1 text-xs capitalize text-gray-500">{order.method}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className={order.paid ? "font-semibold text-emerald-700" : "text-gray-700"}>
                      {order.paid ? "Paid" : "Unpaid"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.payment === "bank_transfer" ? "Bank transfer" : "Cash"}
                      {order.payment === "bank_transfer" && order.receiptPath && !order.paid
                        ? " · slip to check"
                        : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {order.items.reduce((sum, item) => sum + item.qty, 0)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">
                    {formatLKR(order.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between">
          {filters.page > 1 ? (
            <Link href={`/admin/orders${orderFiltersQuery(filters, filters.page - 1)}`} className={btnSecondary}>
              Previous
            </Link>
          ) : (
            <span />
          )}
          <span className={muted}>
            Page {filters.page} of {pages}
          </span>
          {filters.page < pages ? (
            <Link href={`/admin/orders${orderFiltersQuery(filters, filters.page + 1)}`} className={btnSecondary}>
              Next
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </>
  );
}
