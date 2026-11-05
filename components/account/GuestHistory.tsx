"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import {
  deviceOrders,
  devicePlans,
  useDeviceHistory,
} from "@/lib/device-history";
import { formatLKR, formatNumber } from "@/lib/products";
import LocalTime from "../ui/LocalTime";
import { btnPrimary, card, muted, subheading } from "../ui/styles";
import OrderCard from "./OrderCard";
import PlanLinks from "./PlanLinks";

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
              <li key={order.ref}>
                <OrderCard order={order} />
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
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-black/5 p-3 text-sm"
              >
                <span className="space-y-0.5">
                  <span className="block text-gray-900">
                    {t("account.planLine", {
                      people: plan.people,
                      space: formatNumber(plan.space),
                      total: formatLKR(plan.total),
                    })}
                  </span>
                  <LocalTime value={plan.createdAt} className="block text-xs text-gray-500" />
                </span>
                {/* Plans saved before their inputs were kept can only be listed */}
                {plan.inputs && (
                  <PlanLinks
                    view={`/account/plans/device/${plan.id}`}
                    edit={`/planner?device=${plan.id}`}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-gray-500">{t("guest.deviceNote")}</p>
    </>
  );
}
