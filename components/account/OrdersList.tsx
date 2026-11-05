"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import type { StringKey } from "@/lib/i18n/strings";
import type { OrderStatus } from "@/lib/order/checkout";
import type { OrderSummary } from "@/lib/supabase/account";
import { btnGhost, btnPrimary, chip, heading, muted } from "../ui/styles";
import OrderCard from "./OrderCard";

type Tab = "active" | "completed" | "cancelled";

const TABS: { id: Tab; label: StringKey; empty: StringKey }[] = [
  { id: "active", label: "orders.tab.active", empty: "orders.noneActive" },
  { id: "completed", label: "orders.tab.completed", empty: "orders.noneCompleted" },
  { id: "cancelled", label: "orders.tab.cancelled", empty: "orders.noneCancelled" },
];

function tabOf(status: OrderStatus): Tab {
  return status === "completed" || status === "cancelled" ? status : "active";
}

/** The customer's orders, split into those on the way, done and cancelled */
export default function OrdersList({ orders }: { orders: OrderSummary[] }) {
  const { t } = useLanguage();
  const counts = { active: 0, completed: 0, cancelled: 0 };
  for (const order of orders) counts[tabOf(order.status)]++;

  // Open on the orders still on the way, unless there are none
  const [tab, setTab] = useState<Tab>(counts.active > 0 || orders.length === 0 ? "active" : "completed");
  const shown = orders.filter((order) => tabOf(order.status) === tab);
  const current = TABS.find((entry) => entry.id === tab)!;

  return (
    <div className="space-y-4 pb-8">
      <Link href="/account" className={btnGhost}>
        ← {t("plan.back")}
      </Link>
      <h1 className={heading}>{t("account.orders")}</h1>

      <div role="tablist" aria-label={t("account.orders")} className="flex flex-wrap gap-2">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={tab === entry.id}
            className={chip(tab === entry.id)}
            onClick={() => setTab(entry.id)}
          >
            {t(entry.label)} · {counts[entry.id]}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="space-y-3 rounded-3xl bg-white p-6 text-center ring-1 ring-black/5">
          <p className={muted}>{t(current.empty)}</p>
          <Link href="/shop" className={btnPrimary}>
            {t("nav.shop")}
          </Link>
        </div>
      ) : (
        <ul role="tabpanel" className="space-y-3">
          {shown.map((order) => (
            <li key={order.id}>
              <OrderCard order={order} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
