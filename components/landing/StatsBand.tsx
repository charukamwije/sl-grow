"use client";

import type { ReactNode } from "react";
import { useCatalog } from "@/contexts/catalog-context";
import { useLanguage } from "@/contexts/language-context";
import { VEGETABLES } from "@/lib/data/vegetables";
import { formatNumber, type Catalog } from "@/lib/products";
import CountUp from "./CountUp";
import Reveal from "./Reveal";

// The WHO's recommended minimum intake of fruit and vegetables, which it
// also describes as about five portions of 80 g
const WHO_GRAMS_PER_DAY = 400;
const WHO_PORTION_G = 80;

const vegIcon = (catalog: Catalog, vegId: string) =>
  catalog.seedlingFor(vegId)?.icon ?? "🌱";
const yieldPerYear = (veg: (typeof VEGETABLES)[number]) => veg.yieldPerCycle * veg.cyclesPerYear;

// Derived from the planner's own data, so these can never disagree with it
const fastest = [...VEGETABLES].sort((a, b) => a.daysToHarvest - b.daysToHarvest)[0];
const biggest = [...VEGETABLES].sort((a, b) => yieldPerYear(b) - yieldPerYear(a))[0];

// Stable formatters for the count-up (a new function each render would
// restart the count)
const formatWhole = (value: number) => String(Math.round(value));
const formatDecimal = (value: number) => formatNumber(value);

type Stat = {
  key: string;
  value: number;
  format: (value: number) => string;
  unit: string;
  text: string;
  visual: ReactNode;
};

/** The 11 vegetables, popping in one after another */
function VegetableRow() {
  const catalog = useCatalog();

  return (
    <div className="flex flex-wrap gap-1.5">
      {VEGETABLES.map((veg, i) => (
        <span
          key={veg.id}
          className="flex h-9 w-9 animate-fade-up items-center justify-center rounded-xl bg-white/10 text-lg ring-1 ring-white/10"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          {vegIcon(catalog, veg.id)}
        </span>
      ))}
    </div>
  );
}

/** A month-like calendar, one square per day, ending in the harvest */
function DayCalendar({ days, harvestIcon }: { days: number; harvestIcon: string }) {
  return (
    <div className="grid grid-cols-10 gap-1">
      {Array.from({ length: days }, (_, i) =>
        i === days - 1 ? (
          <span key={i} className="flex aspect-square items-center justify-center rounded-md bg-emerald-400 text-xs">
            {harvestIcon}
          </span>
        ) : (
          <span
            key={i}
            className="aspect-square animate-fade-up rounded-md bg-emerald-400/30"
            style={{ animationDelay: `${i * 25}ms` }}
          />
        )
      )}
    </div>
  );
}

/** One fruit per kilogram */
function YieldGrid({ kg, fruit }: { kg: number; fruit: string }) {
  return (
    <div className="grid w-fit grid-cols-5 gap-1.5">
      {Array.from({ length: Math.round(kg) }, (_, i) => (
        <span
          key={i}
          className="flex h-9 w-9 animate-fade-up items-center justify-center rounded-xl bg-white/10 text-lg ring-1 ring-white/10"
          style={{ animationDelay: `${i * 70}ms` }}
        >
          {fruit}
        </span>
      ))}
    </div>
  );
}

/** Five 80 g handfuls make the WHO's 400 g */
function Portions() {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: WHO_GRAMS_PER_DAY / WHO_PORTION_G }, (_, i) => (
        <span
          key={i}
          className="flex h-12 flex-1 animate-fade-up flex-col items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10"
          style={{ animationDelay: `${i * 90}ms` }}
        >
          <span className="text-lg leading-none">🥗</span>
          <span className="mt-0.5 text-[10px] font-medium text-emerald-200">{WHO_PORTION_G} g</span>
        </span>
      ))}
    </div>
  );
}

/**
 * The landing page's headline numbers as a dark "by the numbers" band: four
 * glass cards, each with a big counted-up figure, its unit, one line of
 * explanation and a small picture of what the number means.
 */
export default function StatsBand() {
  const { t, l } = useLanguage();
  const catalog = useCatalog();
  const icon = (vegId: string) => vegIcon(catalog, vegId);

  const stats: Stat[] = [
    {
      key: "veg",
      value: VEGETABLES.length,
      format: formatWhole,
      unit: t("home.unitVeg"),
      text: t("home.statVeg"),
      visual: <VegetableRow />,
    },
    {
      key: "fastest",
      value: fastest.daysToHarvest,
      format: formatWhole,
      unit: t("home.unitDays"),
      text: t("home.statFastest", { name: l(fastest.name) }),
      visual: <DayCalendar days={fastest.daysToHarvest} harvestIcon={icon(fastest.id)} />,
    },
    {
      key: "yield",
      value: yieldPerYear(biggest),
      format: formatDecimal,
      unit: t("home.unitKgYear"),
      text: t("home.statYield", { name: l(biggest.name) }),
      visual: <YieldGrid kg={yieldPerYear(biggest)} fruit={icon(biggest.id)} />,
    },
    {
      key: "who",
      value: WHO_GRAMS_PER_DAY,
      format: formatWhole,
      unit: t("home.unitGDay"),
      text: t("home.statWho"),
      visual: <Portions />,
    },
  ];

  return (
    <section className="relative isolate py-16 sm:py-20">
      {/* Full-bleed dark band with soft glows */}
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2 overflow-hidden bg-gradient-to-br from-emerald-950 via-gray-950 to-emerald-900"
      >
        <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -right-10 bottom-0 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:22px_22px]" />
      </div>

      <Reveal className="mb-10 max-w-2xl space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {t("home.statsTitle")}
        </h2>
        <p className="leading-relaxed text-emerald-100/80">{t("home.statsIntro")}</p>
      </Reveal>

      <Reveal as="dl" stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.key}
            className="lift group flex flex-col gap-4 rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/10 backdrop-blur transition-colors hover:bg-white/10"
          >
            {/* The figure reads first; the term stays first in the markup */}
            <dt className="order-2 text-sm leading-relaxed text-emerald-50/80">{stat.text}</dt>
            <dd className="order-1 flex items-baseline gap-2">
              <span className="bg-gradient-to-br from-white to-emerald-300 bg-clip-text text-5xl font-bold tracking-tight text-transparent">
                <CountUp value={stat.value} format={stat.format} />
              </span>
              <span className="text-sm font-semibold text-emerald-300">{stat.unit}</span>
            </dd>
            <div className="order-3 mt-auto pt-2" aria-hidden="true">
              {stat.visual}
            </div>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
