"use client";

import { useLanguage } from "@/contexts/language-context";
import type { StringKey } from "@/lib/i18n/strings";
import type { CheckoutMethod, OrderStatus } from "@/lib/order/checkout";

const STATUS_TINT: Record<OrderStatus, string> = {
  created: "bg-sky-50 text-sky-800",
  received: "bg-indigo-50 text-indigo-800",
  out_for_delivery: "bg-amber-50 text-amber-800",
  completed: "bg-emerald-50 text-emerald-800",
  cancelled: "bg-gray-100 text-gray-600",
};

/** A pickup order is "ready for pickup" where a delivery is "out for delivery" */
export function statusKey(status: OrderStatus, method: CheckoutMethod): StringKey {
  if (status === "out_for_delivery" && method === "pickup") return "status.readyForPickup";
  return `status.${status}` as StringKey;
}

export function StatusBadge({ status, method }: { status: OrderStatus; method: CheckoutMethod }) {
  const { t } = useLanguage();
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_TINT[status]}`}>
      {t(statusKey(status, method))}
    </span>
  );
}

export function PaidBadge({ paid }: { paid: boolean }) {
  const { t } = useLanguage();
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        paid ? "bg-emerald-600 text-white" : "bg-white text-gray-600 ring-1 ring-gray-200"
      }`}
    >
      {paid ? t("paid.yes") : t("paid.no")}
    </span>
  );
}
