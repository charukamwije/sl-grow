"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import type { OrderSummary, PlanSummary } from "@/lib/firebase/account";
import type { ServerUser } from "@/lib/firebase/auth-server";
import { formatLKR, formatNumber } from "@/lib/products";
import AccountDeleteButton from "../auth/AccountDeleteButton";
import AuthButtons from "../auth/AuthButtons";
import UserIcon from "../icons/UserIcon";
import AuthModal from "../modals/AuthModal";
import { btnPrimary, card, heading, muted, subheading } from "../ui/styles";

export type AccountState =
  | { kind: "disabled" }
  | { kind: "signedOut" }
  | { kind: "unavailable"; user: ServerUser }
  | {
      kind: "signedIn";
      user: ServerUser;
      orders: OrderSummary[];
      plans: PlanSummary[];
    };

// `createdAt` is an ISO string (always UTC). Slicing it instead of calling
// `toLocaleString()` keeps the server-rendered label identical to the
// client's, whatever timezone either side runs in.
function formatDate(createdAt: string): string {
  return `${createdAt.slice(0, 16).replace("T", " ")} UTC`;
}

export default function AccountView({ state }: { state: AccountState }) {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (state.kind === "disabled") {
    // FR-A-10
    return (
      <div className="space-y-4">
        <h1 className={heading}>{t("account.title")}</h1>
        <p className={`${card} text-gray-700`}>{t("account.notConfigured")}</p>
      </div>
    );
  }

  if (state.kind === "signedOut") {
    // FR-A-01
    return (
      <div className="space-y-4">
        <h1 className={heading}>{t("account.title")}</h1>
        <div className={`${card} space-y-4 text-center`}>
          <p className="text-gray-800">{t("account.signInPrompt")}</p>
          <button
            type="button"
            className={btnPrimary}
            onClick={() => setIsModalOpen(true)}
          >
            {t("signInGoogle")}
          </button>
          <p className="text-xs text-gray-600">{t("account.signInPrivacy")}</p>
        </div>
        <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    );
  }

  const { user } = state;

  return (
    <div className="space-y-4">
      <h1 className={heading}>{t("account.title")}</h1>

      {/* FR-A-03 */}
      <section className={`${card} flex flex-col items-center gap-4 sm:flex-row`}>
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-black/5 bg-emerald-50">
          {user.photoURL ? (
            // A plain <img>: the avatar host cannot be pinned in next.config.ts
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoURL}
              alt={user.displayName || "Profile photo"}
              className="h-full w-full object-cover"
              // Google refuses avatar requests that carry a referrer
              referrerPolicy="no-referrer"
            />
          ) : (
            <UserIcon className="h-8 w-8 text-green-600" />
          )}
        </div>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-lg font-semibold text-gray-900">
            {user.displayName || user.email}
          </p>
          <p className={muted}>{user.email}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <AuthButtons user={user} />
          <AccountDeleteButton />
        </div>
      </section>

      {state.kind === "unavailable" ? (
        <p className={`${card} text-gray-700`}>{t("account.unavailable")}</p>
      ) : (
        <>
          {/* FR-A-06 */}
          <section className={card}>
            <h2 className={subheading}>{t("account.orders")}</h2>
            {state.orders.length === 0 ? (
              <p className={muted}>{t("account.noOrders")}</p>
            ) : (
              <ul className="space-y-3">
                {state.orders.map((order) => (
                  <li key={order.id} className="rounded-2xl border border-black/5 p-3">
                    <div className="flex flex-wrap justify-between gap-2 text-sm">
                      <time dateTime={order.createdAt} className="text-gray-600">
                        {formatDate(order.createdAt)}
                      </time>
                      <span className="font-bold text-gray-900">
                        {formatLKR(order.total)}
                      </span>
                    </div>
                    <ul className="mt-2 text-sm text-gray-800">
                      {order.items.map((item) => (
                        <li key={item.code}>
                          <code className="text-xs">{item.code}</code> {item.name} ×{" "}
                          {item.qty} = {formatLKR(item.lineTotal)}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* FR-A-08 */}
          <section className={card}>
            <h2 className={subheading}>{t("account.plans")}</h2>
            {state.plans.length === 0 ? (
              <p className={muted}>{t("account.noPlans")}</p>
            ) : (
              <ul className="space-y-2">
                {state.plans.map((plan) => (
                  <li
                    key={plan.id}
                    className="flex flex-wrap justify-between gap-2 rounded-2xl border border-black/5 p-3 text-sm"
                  >
                    <time dateTime={plan.createdAt} className="text-gray-600">
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
        </>
      )}
    </div>
  );
}
