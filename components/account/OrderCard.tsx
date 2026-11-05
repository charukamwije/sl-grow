"use client";

import Link from "next/link";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import { useLanguage } from "@/contexts/language-context";
import type { OrderStatus } from "@/lib/order/checkout";
import { formatLKR } from "@/lib/products";
import LocalTime from "../ui/LocalTime";
import { PaidBadge, StatusBadge } from "./OrderBadges";

// How many items the card names before "+N more"
const SHOWN_ITEMS = 2;

export type OrderCardOrder = {
  /** Without one (a guest's order on this device) the card is not a link */
  id?: string;
  ref: string | null;
  createdAt: string;
  method: "pickup" | "delivery";
  /** Unknown for a guest's order on this device */
  status?: OrderStatus;
  paid?: boolean;
  items: { code: string; name: string; qty: number }[];
  total: number;
};

/** One order at a glance: reference, when, where it is, what is in it, total */
export default function OrderCard({ order }: { order: OrderCardOrder }) {
  const { t } = useLanguage();
  const shown = order.items.slice(0, SHOWN_ITEMS);
  const hidden = order.items.length - shown.length;

  const body = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex flex-wrap items-center gap-2">
          {order.ref && (
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-mono text-xs font-bold tracking-wider text-emerald-800">
              {order.ref}
            </span>
          )}
          <LocalTime value={order.createdAt} className="text-xs text-gray-500" />
        </span>
        <span className="text-base font-bold tabular-nums text-gray-900">
          {formatLKR(order.total)}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {order.status && <StatusBadge status={order.status} method={order.method} />}
        {order.status && order.status !== "cancelled" && order.paid !== undefined && (
          <PaidBadge paid={order.paid} />
        )}
        <span className="text-xs text-gray-500">
          {order.method === "delivery" ? "🚚" : "🏪"}{" "}
          {t(order.method === "delivery" ? "checkout.delivery" : "checkout.pickup")}
        </span>
      </div>

      <p className="mt-2 truncate text-sm text-gray-700">
        {shown.map((item) => `${item.name} ×${item.qty}`).join(", ")}
        {hidden > 0 && <span className="text-gray-500"> {t("orders.more", { n: hidden })}</span>}
      </p>
    </>
  );

  const frame = "block rounded-2xl border border-black/5 bg-white p-4";

  return order.id ? (
    <Link
      href={`/account/orders/${order.id}`}
      className={`${frame} group relative pr-10 transition hover:border-emerald-200 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500`}
    >
      {body}
      <ChevronRightIcon
        className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-300 transition group-hover:text-emerald-600"
        aria-hidden="true"
      />
    </Link>
  ) : (
    <div className={frame}>{body}</div>
  );
}
