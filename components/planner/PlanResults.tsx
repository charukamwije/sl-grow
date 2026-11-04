"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCatalog } from "@/contexts/catalog-context";
import { useCart } from "@/contexts/cart-context";
import { useLanguage } from "@/contexts/language-context";
import { useNotification } from "@/contexts/notification-context";
import { useSession } from "@/contexts/session-context";
import { devicePlans } from "@/lib/device-history";
import { generateOrderRef, ORDER_REF_PREFIX } from "@/lib/order/reference";
import type { PlanResult, PlannerInputs, PlanRow } from "@/lib/planner/calc";
import { formatLKR, formatNumber } from "@/lib/products";
import ProductTable from "../shop/ProductTable";
import Loading from "../icons/Loading";
import { btnPrimary, btnSecondary, card, muted, subheading } from "../ui/styles";

type PlanResultsProps = {
  plan: PlanResult;
  inputs: PlannerInputs;
};

// Cut-and-come-again crops have many cycles a year (SRS 1.3)
const CUT_AGAIN_CYCLES = 6;

export default function PlanResults({ plan, inputs }: PlanResultsProps) {
  const router = useRouter();
  const { t, l } = useLanguage();
  const { addMany } = useCart();
  const { getProduct } = useCatalog();
  const { user } = useSession();
  const { addSuccessNotification, addErrorNotification } =
    useNotification();
  const [saving, setSaving] = useState(false);

  const harvestPattern = (row: PlanRow) => {
    const pattern =
      row.veg.cyclesPerYear >= CUT_AGAIN_CYCLES
        ? t("harvest.cutAgain")
        : t("harvest.perYear", { n: row.veg.cyclesPerYear });
    return row.veg.climbing ? `${pattern} · ${t("harvest.climber")}` : pattern;
  };

  // FR-P-18
  const addPlanToCart = () => {
    addMany(plan.shopping);
    addSuccessNotification(t("planAdded"));
    router.push("/cart");
  };

  // FR-A-07, FR-A-08: a guest's plan is kept on this device; a signed-in
  // customer's goes to their account
  const savePlan = async () => {
    if (!user) {
      devicePlans.add({
        id: generateOrderRef().replace(ORDER_REF_PREFIX, "PLAN-"),
        createdAt: new Date().toISOString(),
        people: inputs.people,
        space: inputs.space,
        total: plan.shoppingTotal,
      });
      addSuccessNotification(t("planSavedDevice"));
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error);
      addSuccessNotification(t("planSaved"));
      router.refresh();
    } catch (error) {
      console.error("Plan save error:", error);
      addErrorNotification(t("planSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const nothingPlanted = plan.totals.plants === 0;
  const totalNeed = plan.rows.reduce((sum, row) => sum + row.annualNeedKg, 0);
  const coverage = totalNeed > 0 ? plan.health.yearlyHarvestKg / totalNeed : 0;

  return (
    <div className="space-y-4">
      {/* The headline numbers first; the detail follows below */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-green-800 p-6 text-white shadow-lg shadow-emerald-900/10">
        <p className="text-sm font-medium text-emerald-100">{t("glance")}</p>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-3xl font-bold tracking-tight sm:text-4xl">
          {formatLKR(Math.max(0, plan.savings.monthly))}
          <span className="text-sm font-medium text-emerald-100 sm:text-base">
            {t("sav.monthly")}
          </span>
        </p>
        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            [t("sum.plants"), String(plan.totals.plants)],
            [t("sum.coverage"), `${Math.round(coverage * 100)}%`],
            [t("sav.setup"), formatLKR(plan.savings.setupCost)],
            [
              t("sav.payback"),
              plan.savings.paybackMonths === null
                ? "—"
                : t("months", { n: plan.savings.paybackMonths }),
            ],
          ].map(([term, value]) => (
            <div key={term} className="rounded-2xl bg-white/10 p-3 backdrop-blur">
              <dt className="text-xs text-emerald-100">{term}</dt>
              <dd className="mt-0.5 break-words text-base font-semibold sm:text-lg">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Consumption and market cost (FR-P-08, FR-P-09) */}
      <section className={card}>
        <h2 className={subheading}>{t("res.consumption")}</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{t("col.vegetable")}</th>
                <th className="num">{t("col.weeklyKg")}</th>
                <th className="num">{t("col.monthlyCost")}</th>
              </tr>
            </thead>
            <tbody>
              {plan.rows.map((row) => (
                <tr key={row.veg.id}>
                  <td>{l(row.veg.name)}</td>
                  <td className="num">{formatNumber(row.weeklyKg, 2)}</td>
                  <td className="num">{formatLKR(row.monthlyCost)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th>{t("total")}</th>
                <th className="num">{formatNumber(plan.totals.weeklyKg, 2)}</th>
                <th className="num">{formatLKR(plan.totals.monthlyCost)}</th>
              </tr>
            </tfoot>
          </table>
        </div>
        <ul className="mt-3 space-y-1 text-sm text-gray-800">
          <li>{t("weeklyTotal", { kg: formatNumber(plan.totals.weeklyKg, 2) })}</li>
          <li>{t("monthlyTotal", { amount: formatLKR(plan.totals.monthlyCost) })}</li>
          <li className="font-semibold">
            {t("yearlyTotal", { amount: formatLKR(plan.totals.yearlyCost) })}
          </li>
        </ul>
      </section>

      {/* Grow plan (FR-P-10 to FR-P-14) */}
      <section className={card}>
        <h2 className={subheading}>{t("res.growPlan")}</h2>
        {nothingPlanted ? (
          <p role="alert" className="rounded-2xl bg-amber-50 p-3 text-amber-900">
            {t("spaceTooSmall")}
          </p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t("col.vegetable")}</th>
                  <th className="num">{t("col.plants")}</th>
                  <th className="num">{t("col.space")}</th>
                  <th>{t("col.container")}</th>
                  <th className="num">{t("col.coverage")}</th>
                  <th>{t("col.harvest")}</th>
                </tr>
              </thead>
              <tbody>
                {plan.rows.map((row) => (
                  <tr key={row.veg.id} className={row.plants === 0 ? "text-gray-500" : ""}>
                    <td>{l(row.veg.name)}</td>
                    <td className="num">
                      {row.plants} / {row.plantsNeeded}
                    </td>
                    <td className="num">{formatNumber(row.spaceUsed)}</td>
                    <td>{l(getProduct(row.containerId)?.name ?? { en: row.containerId, si: row.containerId, ta: row.containerId })}</td>
                    <td className="num">{Math.round(row.coverage * 100)}%</td>
                    <td>{harvestPattern(row)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-sm text-gray-800">
          {t("spaceSummary", {
            used: formatNumber(plan.totals.spaceUsed),
            space: formatNumber(inputs.space),
            full: formatNumber(plan.totals.spaceNeeded),
          })}
        </p>
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-medium text-emerald-700">
            💡 {t("tips.title")}
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-700">
            <li>{t("tips.1")}</li>
            <li>{t("tips.2")}</li>
            <li>{t("tips.3")}</li>
            <li>{t("tips.4")}</li>
          </ul>
        </details>
      </section>

      {/* Shopping list (FR-P-15 to FR-P-18), hidden when nothing is planted */}
      {plan.shopping.length > 0 && (
        <section className={card}>
          <h2 className={subheading}>{t("res.shopping")}</h2>
          <p className={`${muted} mb-2`}>{t("shopPricesNote")}</p>
          <ProductTable lines={plan.shopping} />
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className={btnPrimary} onClick={addPlanToCart}>
              🛒 {t("addPlanToCart")}
            </button>
            <button
              type="button"
              className={btnSecondary}
              onClick={savePlan}
              disabled={saving}
            >
              {saving && <Loading size="small" color="green" />}
              💾 {t("savePlan")}
            </button>
          </div>
        </section>
      )}

      {/* Savings (FR-P-19, FR-P-20) */}
      {!nothingPlanted && (
        <section className={card}>
          <h2 className={subheading}>{t("res.savings")}</h2>
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              [t("sav.monthly"), formatLKR(plan.savings.monthly)],
              [t("sav.yearly"), formatLKR(plan.savings.yearly)],
              [t("sav.setup"), formatLKR(plan.savings.setupCost)],
              [
                t("sav.payback"),
                plan.savings.paybackMonths === null
                  ? t("noPayback")
                  : t("months", { n: plan.savings.paybackMonths }),
              ],
            ].map(([term, value]) => (
              <div key={term} className="rounded-2xl bg-emerald-50 p-3">
                <dt className="text-xs text-gray-700">{term}</dt>
                <dd className="text-lg font-bold text-gray-900">{value}</dd>
              </div>
            ))}
          </dl>
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer font-medium text-emerald-700">
              {t("sav.howTitle")}
            </summary>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-700">
              <li>{t("sav.how1")}</li>
              <li>{t("sav.how2")}</li>
              <li>{t("sav.how3")}</li>
            </ul>
          </details>
        </section>
      )}

      {/* Health (FR-P-21, FR-P-22) */}
      <section className={card}>
        <h2 className={subheading}>{t("res.health")}</h2>
        <ul className="mb-3 space-y-1 text-sm font-medium text-gray-900">
          <li>
            🥗{" "}
            {t("health.daily", {
              n: formatNumber(plan.health.dailyGramsPerPerson, 0),
            })}
          </li>
          <li>
            🌱{" "}
            {t("health.harvest", {
              n: formatNumber(plan.health.yearlyHarvestKg, 0),
            })}
          </li>
        </ul>
        <ul className="space-y-1 text-sm text-gray-700">
          {plan.rows.map((row) => (
            <li key={row.veg.id}>
              <strong>{l(row.veg.name)}:</strong> {l(row.veg.health)}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-gray-600">{t("health.disclaimer")}</p>
      </section>
    </div>
  );
}
