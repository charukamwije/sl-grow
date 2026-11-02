"use client";

import Link from "next/link";
import { ArrowRightIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/20/solid";
import { useLanguage } from "@/contexts/language-context";
import { VEGETABLES } from "@/lib/data/vegetables";
import type { StringKey } from "@/lib/i18n/strings";
import { computePlan, defaultInputs } from "@/lib/planner/calc";
import { formatLKR, formatNumber, seedlingFor } from "@/lib/products";
import { btnPrimary, btnSecondary, card, eyebrow } from "../ui/styles";
import BarChart from "./BarChart";
import CountUp from "./CountUp";
import GrowingPlant from "./GrowingPlant";
import ProvinceMap from "./ProvinceMap";
import Reveal from "./Reveal";
import StoryRotator, { type StoryBeat } from "./StoryRotator";

// The WHO's recommended minimum intake of fruit and vegetables
const WHO_GRAMS_PER_DAY = 400;

// The hero's story: the gift, the problem, the answer
const STORY: StoryBeat[] = [
  { label: "home.story1Label", text: "home.story1", icon: "☀️", tint: "bg-amber-100", labelColor: "text-amber-700" },
  { label: "home.story2Label", text: "home.story2", icon: "🚚", tint: "bg-gray-100", labelColor: "text-gray-500" },
  { label: "home.story3Label", text: "home.story3", icon: "🌱", tint: "bg-emerald-100", labelColor: "text-emerald-700" },
];

const ADVANTAGES:{ title: StringKey; text: StringKey; icon: string }[] = [
  { title: "home.advSun", text: "home.advSunText", icon: "☀️" },
  { title: "home.advWarm", text: "home.advWarmText", icon: "🌡️" },
  { title: "home.advRain", text: "home.advRainText", icon: "🌧️" },
  { title: "home.advTradition", text: "home.advTraditionText", icon: "🏡" },
];

const BENEFITS: { title: StringKey; text: StringKey; icon: string; tint: string }[] = [
  { title: "home.benFresh", text: "home.benFreshText", icon: "🥬", tint: "bg-lime-50" },
  { title: "home.benCalm", text: "home.benCalmText", icon: "🧘", tint: "bg-sky-50" },
  { title: "home.benJoy", text: "home.benJoyText", icon: "😊", tint: "bg-amber-50" },
  { title: "home.benFamily", text: "home.benFamilyText", icon: "👨‍👩‍👧", tint: "bg-rose-50" },
];

const ZONES: { key: StringKey; text: StringKey; icon: string; tint: string }[] = [
  { key: "home.zoneWet", text: "home.zoneWetText", icon: "🌧️", tint: "bg-sky-50" },
  { key: "home.zoneIntermediate", text: "home.zoneIntermediateText", icon: "⛅", tint: "bg-lime-50" },
  { key: "home.zoneDry", text: "home.zoneDryText", icon: "☀️", tint: "bg-amber-50" },
  { key: "home.zoneUp", text: "home.zoneUpText", icon: "⛰️", tint: "bg-emerald-50" },
];

const HOW: { title: StringKey; text: StringKey; icon: string }[] = [
  { title: "home.how1", text: "home.how1Text", icon: "🏡" },
  { title: "home.how2", text: "home.how2Text", icon: "📋" },
  { title: "home.how3", text: "home.how3Text", icon: "💬" },
];

const icon = (vegId: string) => seedlingFor(vegId)?.icon ?? "🌱";

// Everything below is derived from the planner's own data, so the landing
// page and the planner can never disagree
const yieldPerYear = (veg: (typeof VEGETABLES)[number]) =>
  veg.yieldPerCycle * veg.cyclesPerYear;
const fastest = [...VEGETABLES].sort((a, b) => a.daysToHarvest - b.daysToHarvest)[0];
const biggest = [...VEGETABLES].sort((a, b) => yieldPerYear(b) - yieldPerYear(a))[0];
// The planner's default household: the savings quoted on this page
const DEFAULTS = defaultInputs();
const DEFAULT_PLAN = computePlan(DEFAULTS);

// Stable formatters for the count-up numbers (a new function each render
// would restart the count)
const formatWhole = (value: number) => String(Math.round(value));
const formatDecimal = (value: number) => formatNumber(value);

const sectionTitle = "text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl";

function Ctas({ center, dark }: { center?: boolean; dark?: boolean }) {
  const { t } = useLanguage();
  return (
    <div className={`flex flex-col gap-3 sm:flex-row ${center ? "sm:justify-center" : ""}`}>
      <Link
        href="/planner"
        className={`${btnPrimary} group !px-6 !py-3.5 text-base hover:shadow-lg hover:shadow-emerald-600/30`}
      >
        🌱 {t("home.ctaPlan")}
        <ArrowRightIcon
          className="h-5 w-5 transition-transform group-hover:translate-x-1"
          aria-hidden="true"
        />
      </Link>
      <Link
        href="/shop"
        className={`${btnSecondary} !px-6 !py-3.5 text-base ${dark ? "!ring-0" : ""}`}
      >
        🛒 {t("home.ctaShop")}
      </Link>
    </div>
  );
}

export default function LandingPage() {
  const { t, l } = useLanguage();

  const daysRows = [...VEGETABLES]
    .sort((a, b) => a.daysToHarvest - b.daysToHarvest)
    .map((veg) => ({
      key: veg.id,
      label: l(veg.name),
      icon: icon(veg.id),
      value: veg.daysToHarvest,
      display: t("days", { n: veg.daysToHarvest }),
    }));

  // BR-06: market value grown per sq ft per year, the planner's own ranking
  const valueRows = VEGETABLES.map((veg) => {
    const value = (veg.price * yieldPerYear(veg)) / veg.spacePerPlant;
    return {
      key: veg.id,
      label: l(veg.name),
      icon: icon(veg.id),
      value,
      display: formatLKR(value),
    };
  }).sort((a, b) => b.value - a.value);

  const stats = [
    { value: VEGETABLES.length, format: formatWhole, text: t("home.statVeg") },
    {
      value: fastest.daysToHarvest,
      format: formatWhole,
      text: t("home.statFastest", { name: l(fastest.name) }),
    },
    {
      value: yieldPerYear(biggest),
      format: formatDecimal,
      text: t("home.statYield", { name: l(biggest.name) }),
    },
    { value: WHO_GRAMS_PER_DAY, format: formatWhole, text: t("home.statWho") },
  ];

  return (
    <div className="space-y-20 sm:space-y-28">
      {/* Hero */}
      <section className="relative isolate -mx-4 -mt-6 overflow-hidden px-4 pb-6 pt-10 md:-mt-8 sm:pt-16">
        {/* Slowly drifting colour behind the hero */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-24 -top-24 h-80 w-80 animate-blob rounded-full bg-emerald-200/60 blur-3xl" />
          <div className="absolute right-0 top-20 h-72 w-72 animate-blob rounded-full bg-amber-100/80 blur-3xl [animation-delay:-6s]" />
          <div className="absolute bottom-0 left-1/3 h-64 w-64 animate-blob rounded-full bg-lime-100/70 blur-3xl [animation-delay:-12s]" />
        </div>

        <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-6">
            <p
              className={`${eyebrow} inline-flex animate-fade-up items-center gap-2 rounded-full bg-white px-3 py-1 shadow-sm ring-1 ring-emerald-100`}
            >
              <span className="inline-block animate-sway">🌴</span> {t("home.badge")}
            </p>
            <h1 className="animate-fade-up text-3xl font-bold leading-tight tracking-tight text-gray-900 [animation-delay:100ms] sm:text-5xl">
              {t("home.title")}
            </h1>
            {/* The pitch as a three-beat story, one beat at a time, on a loop */}
            <div className="animate-fade-up [animation-delay:250ms]">
              <StoryRotator beats={STORY} />
            </div>
            <div className="animate-fade-up [animation-delay:400ms]">
              <Ctas />
            </div>
          </div>

          <div className="animate-fade-up [animation-delay:200ms]">
            <GrowingPlant />
          </div>
        </div>
      </section>

      {/* Why Sri Lanka */}
      <section className="space-y-6">
        <Reveal className="max-w-2xl space-y-2">
          <h2 className={sectionTitle}>{t("home.islandTitle")}</h2>
          <p className="leading-relaxed text-gray-600">{t("home.islandIntro")}</p>
        </Reveal>
        <Reveal stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ADVANTAGES.map((item) => (
            <article key={item.title} className={`${card} lift`}>
              <span className="inline-block text-3xl transition-transform duration-500 hover:scale-125" aria-hidden="true">
                {item.icon}
              </span>
              <h3 className="mt-3 font-semibold text-gray-900">{t(item.title)}</h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">{t(item.text)}</p>
            </article>
          ))}
        </Reveal>
      </section>

      {/* Province map */}
      <section id="provinces" className="scroll-mt-24 space-y-6">
        <Reveal className="max-w-2xl space-y-2">
          <h2 className={sectionTitle}>{t("home.mapTitle")}</h2>
          <p className="leading-relaxed text-gray-600">{t("home.mapIntro")}</p>
        </Reveal>
        <Reveal>
          <ProvinceMap />
        </Reveal>
      </section>

      {/* Shop versus garden */}
      <section className="space-y-6">
        <Reveal>
          <h2 className={sectionTitle}>{t("home.journeyTitle")}</h2>
        </Reveal>
        <Reveal stagger className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl bg-gray-100 p-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl" aria-hidden="true">🚚</span>
              <h3 className="text-lg font-semibold text-gray-700">{t("home.journeyShop")}</h3>
            </div>
            <ul className="mt-4 space-y-3">
              {(["home.journeyShop1", "home.journeyShop2", "home.journeyShop3"] as const).map((key) => (
                <li key={key} className="flex gap-2 text-sm text-gray-600">
                  <XCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />
                  {t(key)}
                </li>
              ))}
            </ul>
          </article>
          <article className="lift rounded-3xl bg-emerald-50 p-6 ring-2 ring-emerald-500">
            <div className="flex items-center gap-3">
              <span className="inline-block animate-sway text-3xl" aria-hidden="true">🧺</span>
              <h3 className="text-lg font-semibold text-emerald-900">{t("home.journeyHome")}</h3>
            </div>
            <ul className="mt-4 space-y-3">
              {(["home.journeyHome1", "home.journeyHome2", "home.journeyHome3"] as const).map((key) => (
                <li key={key} className="flex gap-2 text-sm text-gray-800">
                  <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                  {t(key)}
                </li>
              ))}
            </ul>
          </article>
        </Reveal>
      </section>

      {/* Benefits: money first, then wellbeing */}
      <section className="space-y-6">
        <Reveal>
          <h2 className={sectionTitle}>{t("home.benefitsTitle")}</h2>
        </Reveal>
        <div className="grid gap-4 lg:grid-cols-3">
          <Reveal className="lg:row-span-2">
            <article className="relative h-full overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-green-800 p-6 text-white shadow-sm">
              <div aria-hidden="true" className="absolute -right-10 -top-10 h-40 w-40 animate-blob rounded-full bg-white/10 blur-2xl" />
              <span className="relative inline-block animate-float text-4xl" aria-hidden="true">💰</span>
              <h3 className="relative mt-4 text-xl font-bold">{t("home.benMoney")}</h3>
              <p className="relative mt-4 text-4xl font-bold tracking-tight">
                <CountUp value={DEFAULT_PLAN.savings.monthly} format={formatLKR} />
              </p>
              <p className="relative mt-3 text-sm leading-relaxed text-emerald-50">
                {t("home.benMoneyText", {
                  people: DEFAULTS.people,
                  space: DEFAULTS.space,
                  amount: formatLKR(DEFAULT_PLAN.savings.monthly),
                  year: formatLKR(DEFAULT_PLAN.savings.yearly),
                })}
              </p>
              <Link
                href="/planner"
                className="group relative mt-6 inline-flex items-center gap-1 text-sm font-semibold text-white underline-offset-4 hover:underline"
              >
                {t("home.ctaPlan")}
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </article>
          </Reveal>
          <Reveal stagger className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
            {BENEFITS.map((item) => (
              <article key={item.title} className={`${card} lift`}>
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.tint} text-2xl`}
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                <h3 className="mt-3 font-semibold text-gray-900">{t(item.title)}</h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">{t(item.text)}</p>
              </article>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Start small */}
      <Reveal as="section" className="relative overflow-hidden rounded-3xl bg-amber-50 px-6 py-12 text-center ring-1 ring-amber-100 sm:px-12">
        <p className="inline-block animate-float text-5xl" aria-hidden="true">🪴</p>
        <p className="mx-auto mt-4 max-w-2xl text-xl font-semibold leading-snug text-gray-900 sm:text-2xl">
          {t("home.quote")}
        </p>
      </Reveal>

      {/* Headline numbers */}
      <section>
        <Reveal as="dl" stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat) => (
            // The number reads first visually; the term stays first in the markup
            <div key={stat.text} className={`${card} lift flex flex-col-reverse justify-end gap-1`}>
              <dt className="text-sm leading-snug text-gray-600">{stat.text}</dt>
              <dd className="text-3xl font-bold tracking-tight text-emerald-700 sm:text-4xl">
                <CountUp value={stat.value} format={stat.format} />
              </dd>
            </div>
          ))}
        </Reveal>
      </section>

      {/* Seasons */}
      <section className="space-y-5">
        <Reveal className="max-w-2xl space-y-2">
          <h2 className={sectionTitle}>{t("home.seasonsTitle")}</h2>
          <p className="text-gray-600">{t("home.seasonsIntro")}</p>
        </Reveal>
        <Reveal stagger className="grid gap-4 md:grid-cols-2">
          {[
            { name: "home.maha", when: "home.mahaWhen", text: "home.mahaText", icon: "🌾", tint: "from-emerald-600 to-green-800" },
            { name: "home.yala", when: "home.yalaWhen", text: "home.yalaText", icon: "🌦️", tint: "from-sky-600 to-cyan-800" },
          ].map((season) => (
            <article
              key={season.name}
              className={`lift rounded-3xl bg-gradient-to-br ${season.tint} p-6 text-white shadow-sm`}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-bold">{t(season.name as StringKey)}</h3>
                <span className="inline-block animate-sway text-3xl" aria-hidden="true">{season.icon}</span>
              </div>
              <p className="mt-1 text-sm font-medium text-white/80">
                {t(season.when as StringKey)}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-white/95">
                {t(season.text as StringKey)}
              </p>
            </article>
          ))}
        </Reveal>
      </section>

      {/* Zones */}
      <section className="space-y-5">
        <Reveal>
          <h2 className={sectionTitle}>{t("home.zonesTitle")}</h2>
        </Reveal>
        <Reveal stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ZONES.map((zone) => (
            <article key={zone.key} className={`${card} lift`}>
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-2xl ${zone.tint} text-2xl`}
                aria-hidden="true"
              >
                {zone.icon}
              </span>
              <h3 className="mt-3 font-semibold text-gray-900">{t(zone.key)}</h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">{t(zone.text)}</p>
            </article>
          ))}
        </Reveal>
      </section>

      {/* Charts from the planner's data */}
      <section className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <Reveal>
            <BarChart
              title={t("home.daysTitle")}
              rows={daysRows}
              labelHeading={t("col.vegetable")}
              valueHeading={t("stat.days")}
              tableToggle={t("home.tableView")}
            />
          </Reveal>
          <Reveal>
            <BarChart
              title={t("home.valueTitle")}
              subtitle={t("home.valueSubtitle")}
              rows={valueRows}
              labelHeading={t("col.vegetable")}
              valueHeading={t("home.valueSubtitle")}
              tableToggle={t("home.tableView")}
            />
          </Reveal>
        </div>
        <p className="text-xs text-gray-500">{t("home.chartSource")}</p>
      </section>

      {/* How it works */}
      <section className="space-y-5">
        <Reveal>
          <h2 className={sectionTitle}>{t("home.howTitle")}</h2>
        </Reveal>
        <Reveal as="ol" stagger className="grid gap-3 md:grid-cols-3">
          {HOW.map((step, i) => (
            <li key={step.title} className={`${card} lift flex gap-4`}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                {i + 1}
              </span>
              <div>
                <h3 className="font-semibold text-gray-900">
                  <span aria-hidden="true">{step.icon}</span> {t(step.title)}
                </h3>
                <p className="mt-1 text-sm text-gray-600">{t(step.text)}</p>
              </div>
            </li>
          ))}
        </Reveal>
      </section>

      {/* Closing call to action */}
      <Reveal as="section" className="relative overflow-hidden rounded-3xl bg-gray-900 px-6 py-12 text-center sm:py-16">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 -top-16 h-56 w-56 animate-blob rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute -bottom-16 -right-16 h-56 w-56 animate-blob rounded-full bg-amber-400/10 blur-3xl [animation-delay:-9s]" />
        </div>
        <h2 className="relative text-2xl font-bold tracking-tight text-white sm:text-4xl">
          {t("home.finalTitle")}
        </h2>
        <p className="relative mx-auto mt-3 max-w-xl text-gray-300">{t("home.finalText")}</p>
        <div className="relative mt-8">
          <Ctas center dark />
        </div>
      </Reveal>
    </div>
  );
}
