"use client";

import { useLanguage } from "@/contexts/language-context";
import {
  getGuide,
  SOIL_MIX_PER_BAG,
  type Guide,
} from "@/lib/data/guides";
import { SHARED_SUPPLIES } from "@/lib/data/products";
import { VEGETABLES } from "@/lib/data/vegetables";
import { containerFor } from "@/lib/planner/calc";
import {
  formatLKR,
  formatNumber,
  getProduct,
  lineTotal,
  seedlingFor,
} from "@/lib/products";
import ProductTable from "../shop/ProductTable";
import ProductText from "../shop/ProductText";
import { card, heading, subheading } from "../ui/styles";
import GuideList from "./GuideList";

function sumLines(lines: { productId: string; qty: number }[]): number {
  return lines.reduce((sum, line) => sum + lineTotal(line.productId, line.qty), 0);
}

/** FR-G-03, FR-G-04: the figures shown above each guide's steps */
function useGuideStats(guide: Guide): { label: string; value: string }[] {
  const { t, l } = useLanguage();

  if (guide.kind === "package") {
    return [
      { label: t("stat.setupCost"), value: formatLKR(sumLines(SHARED_SUPPLIES)) },
      { label: t("stat.readiness"), value: guide.time ? l(guide.time) : "" },
    ];
  }

  if (guide.kind === "soil") {
    return [
      { label: t("stat.mixCost"), value: formatLKR(sumLines(SOIL_MIX_PER_BAG)) },
      { label: t("stat.readiness"), value: guide.time ? l(guide.time) : "" },
    ];
  }

  const veg = VEGETABLES.find((v) => v.id === guide.vegId);
  if (!veg) return [];

  const seedlingPrice = seedlingFor(veg.id)?.price ?? 0;
  const containerPrice = getProduct(containerFor(veg.spacePerPlant))?.price ?? 0;
  const harvestPerYear = veg.yieldPerCycle * veg.cyclesPerYear;

  return [
    { label: t("stat.space"), value: t("sqft", { n: formatNumber(veg.spacePerPlant) }) },
    { label: t("stat.startCost"), value: formatLKR(seedlingPrice + containerPrice) },
    { label: t("stat.seedlingYear"), value: formatLKR(seedlingPrice * veg.cyclesPerYear) },
    { label: t("stat.days"), value: t("days", { n: veg.daysToHarvest }) },
    { label: t("stat.harvestYear"), value: t("kg", { n: formatNumber(harvestPerYear) }) },
    { label: t("stat.valueYear"), value: formatLKR(harvestPerYear * veg.price) },
  ];
}

export default function GuideView({ id }: { id: string }) {
  const guide = getGuide(id)!;
  const { t, l } = useLanguage();
  const stats = useGuideStats(guide);

  return (
    <div className="space-y-4">
      <GuideList currentId={guide.id} compact />

      <h1 className={heading}>
        <span aria-hidden="true">{guide.icon}</span> {l(guide.name)}
      </h1>

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg bg-green-50 p-3">
            <dt className="text-xs text-gray-700">{stat.label}</dt>
            <dd className="font-bold text-green-900">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <ol className="space-y-3">
        {guide.steps.map((step, i) => (
          <li key={i} className={`${card} flex gap-3`}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-700 text-sm font-bold text-white">
              {i + 1}
            </span>
            <div>
              <h2 className="font-semibold text-gray-900">
                <span className="sr-only">{t("stepN", { n: i + 1 })}: </span>
                {l(step.title)}
              </h2>
              <p className="mt-1 text-sm text-gray-700">
                <ProductText text={l(step.text)} />
              </p>
            </div>
          </li>
        ))}
      </ol>

      <section className={card}>
        <h2 className={subheading}>{t("guides.recommended")}</h2>
        <ProductTable
          lines={guide.products.map((productId) => ({ productId, qty: 1 }))}
          addButtons
        />
      </section>
    </div>
  );
}
