"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import {
  deviceOrders,
  devicePlans,
  useDeviceHistory,
} from "@/lib/device-history";
import { formatLKR, formatNumber } from "@/lib/products";
import { btnPrimary, card, muted, subheading } from "../ui/styles";

// `createdAt` is an ISO string (always UTC). Slicing it keeps the label
// identical however the device's clock is set.
function formatDate(createdAt: string): string {
  return `${createdAt.slice(0, 16).replace("T", " ")} UTC`;
}

/**
 * A guest's orders and plans, read from this device. Each order shows the
 * reference the customer quotes to the shop.
 */
export default function GuestHistory() {
  const { t } = useLanguage();
  const orders = useDeviceHistory(deviceOrders);
  const plans = useDeviceHistory(devicePlans);

  return (
    <>
      <section className={card}>
        <h2 className={subheading}>{t("account.orders")}</h2>
        {orders.length === 0 ? (
          <div className="space-y-3">
            <p className={muted}>{t("account.noOrders")}</p>
            <Link href="/shop" className={btnPrimary}>
              {t("nav.shop")}
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {orders.map((order) => (
              <li key={order.ref} className="rounded-2xl border border-black/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 font-mono text-sm font-bold tracking-wider text-emerald-800">
                    {order.ref}
                  </span>
                  <span className="font-bold text-gray-900">{formatLKR(order.total)}</span>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  <time dateTime={order.createdAt}>{formatDate(order.createdAt)}</time>
                  {" · "}
                  {t(order.method === "delivery" ? "checkout.delivery" : "checkout.pickup")}
                </p>
                <ul className="mt-2 space-y-0.5 text-sm text-gray-700">
                  {order.items.map((item) => (
                    <li key={item.code}>
                      <code className="text-xs">{item.code}</code> {item.name} × {item.qty} ={" "}
                      {formatLKR(item.lineTotal)}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={card}>
        <h2 className={subheading}>{t("account.plans")}</h2>
        {plans.length === 0 ? (
          <div className="space-y-3">
            <p className={muted}>{t("account.noPlans")}</p>
            <Link href="/planner" className={btnPrimary}>
              {t("nav.planner")}
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {plans.map((plan) => (
              <li
                key={plan.id}
                className="flex flex-wrap justify-between gap-2 rounded-2xl border border-black/5 p-3 text-sm"
              >
                <time dateTime={plan.createdAt} className="text-gray-500">
                  {formatDate(plan.createdAt)}
                </time>
                <span className="text-gray-900">
                  {t("account.planLine", {
                    people: plan.people,
                    space: formatNumber(plan.space),
                    total: formatLKR(plan.total),
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-gray-500">{t("guest.deviceNote")}</p>
    </>
  );
}
