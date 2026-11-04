"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  SpeakerWaveIcon,
  StopIcon,
} from "@heroicons/react/24/solid";
import { useCatalog } from "@/contexts/catalog-context";
import { useLanguage } from "@/contexts/language-context";
import { useNotification } from "@/contexts/notification-context";
import { SOIL_MIX_PER_BAG, type Guide, type GuideStep } from "@/lib/data/guides";
import type { GuideSummary } from "@/lib/guides";
import { SHARED_SUPPLIES } from "@/lib/data/products";
import { VEGETABLES } from "@/lib/data/vegetables";
import { containerFor } from "@/lib/planner/calc";
import { formatLKR, formatNumber, type Catalog } from "@/lib/products";
import { useSpeech } from "@/lib/use-speech";
import ProductTable from "../shop/ProductTable";
import ProductText from "../shop/ProductText";
import Segmented from "../ui/Segmented";
import { card, subheading } from "../ui/styles";
import GuideList from "./GuideList";

type Fact = { icon: string; label: string; value: string };

function sumLines(
  { lineTotal }: Catalog,
  lines: { productId: string; qty: number }[]
): number {
  return lines.reduce((sum, line) => sum + lineTotal(line.productId, line.qty), 0);
}

/** FR-G-03, FR-G-04: the key figures, each with a picture */
function useGuideFacts(guide: Guide): Fact[] {
  const { t, l } = useLanguage();
  const catalog = useCatalog();
  const { getProduct, seedlingFor } = catalog;

  if (guide.kind === "package") {
    return [
      { icon: "💰", label: t("stat.setupCost"), value: formatLKR(sumLines(catalog, SHARED_SUPPLIES)) },
      { icon: "⏱️", label: t("stat.readiness"), value: guide.time ? l(guide.time) : "" },
    ];
  }

  if (guide.kind === "soil") {
    return [
      { icon: "💰", label: t("stat.mixCost"), value: formatLKR(sumLines(catalog, SOIL_MIX_PER_BAG)) },
      { icon: "⏱️", label: t("stat.readiness"), value: guide.time ? l(guide.time) : "" },
    ];
  }

  const veg = VEGETABLES.find((v) => v.id === guide.vegId);
  if (!veg) return [];

  const seedlingPrice = seedlingFor(veg.id)?.price ?? 0;
  const containerPrice = getProduct(containerFor(veg.spacePerPlant))?.price ?? 0;
  const harvestPerYear = veg.yieldPerCycle * veg.cyclesPerYear;

  return [
    { icon: "⏱️", label: t("stat.days"), value: t("days", { n: veg.daysToHarvest }) },
    { icon: "🧺", label: t("stat.harvestYear"), value: t("kg", { n: formatNumber(harvestPerYear) }) },
    { icon: "📐", label: t("stat.space"), value: t("sqft", { n: formatNumber(veg.spacePerPlant) }) },
    { icon: "💰", label: t("stat.startCost"), value: formatLKR(seedlingPrice + containerPrice) },
    { icon: "🌱", label: t("stat.seedlingYear"), value: formatLKR(seedlingPrice * veg.cyclesPerYear) },
    { icon: "💵", label: t("stat.valueYear"), value: formatLKR(harvestPerYear * veg.price) },
  ];
}

// One idea per line: a step's text split at its full stops
function sentences(text: string): string[] {
  const parts = text.split(/\.\s+/);
  return parts
    .map((part, i) => (i < parts.length - 1 ? `${part}.` : part).trim())
    .filter(Boolean);
}

// Guide text without the [[product_id]] markers, for reading aloud
function plain(text: string, nameOf: (id: string) => string): string {
  return text.replace(/\[\[(\w+)\]\]/g, (_, id: string) => nameOf(id));
}

/** One step, shown big: its picture, a short title, then one idea per line */
function StepCard({ step, n }: { step: GuideStep; n: number }) {
  const { t, l } = useLanguage();

  return (
    <div className="animate-fade-up text-center">
      <span
        aria-hidden="true"
        className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-emerald-50 text-6xl shadow-inner ring-8 ring-emerald-50/50 sm:h-32 sm:w-32 sm:text-7xl"
      >
        {step.icon}
      </span>
      <h2 className="mt-5 text-2xl font-bold text-gray-900 sm:text-3xl">
        <span className="sr-only">{t("stepN", { n })}: </span>
        {l(step.title)}
      </h2>
      <ul className="mx-auto mt-5 max-w-lg space-y-3 text-left">
        {sentences(l(step.text)).map((sentence, i) => (
          <li key={i} className="flex gap-3 text-lg leading-relaxed text-gray-800">
            <span
              aria-hidden="true"
              className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white"
            >
              ✓
            </span>
            <span>
              <ProductText text={sentence} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type GuideViewProps = {
  guide: Guide;
  /** For the strip of other guides at the top; none in the editor's preview */
  guides: GuideSummary[];
};

export default function GuideView({ guide, guides }: GuideViewProps) {
  const { lang, t, l } = useLanguage();
  const { getProduct } = useCatalog();
  const { addInfoNotification } = useNotification();
  const facts = useGuideFacts(guide);
  const speech = useSpeech(lang);
  const [mode, setMode] = useState<"steps" | "all">("steps");
  // One past the last step is the "well done" card
  const [current, setCurrent] = useState(0);
  const touchStart = useRef<number | null>(null);

  const total = guide.steps.length;
  const finished = current >= total;
  const step = guide.steps[Math.min(current, total - 1)];

  const go = (next: number) => {
    speech.stop();
    setCurrent(Math.max(0, Math.min(total, next)));
  };

  // Arrow keys move between steps, outside text fields
  useEffect(() => {
    if (mode !== "steps") return;
    const onKey = (event: KeyboardEvent) => {
      // Key presses can come from the window itself, not just an element
      const target = event.target;
      if (target instanceof Element && target.closest("input, textarea, select")) return;
      if (event.key === "ArrowRight") setCurrent((c) => Math.min(total, c + 1));
      if (event.key === "ArrowLeft") setCurrent((c) => Math.max(0, c - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, total]);

  const listen = () => {
    if (speech.speaking) {
      speech.stop();
      return;
    }
    const nameOf = (productId: string) => {
      const product = getProduct(productId);
      return product ? l(product.name) : productId;
    };
    const ok = speech.speak(`${l(step.title)}. ${plain(l(step.text), nameOf)}`);
    if (!ok) addInfoNotification(t("guides.noVoice"));
  };

  return (
    <div className="space-y-6">
      {guides.length > 0 && <GuideList guides={guides} currentId={guide.id} compact />}

      {/* Title and the key facts as picture tiles */}
      <header className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-white text-4xl shadow-sm ring-1 ring-black/5"
        >
          {guide.icon}
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{l(guide.name)}</h1>
      </header>

      <section aria-label={t("guides.atAGlance")}>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {facts.map((fact) => (
            <div key={fact.label} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <span aria-hidden="true" className="text-3xl">{fact.icon}</span>
              {/* Value reads first; the term stays first in the markup */}
              <div className="flex min-w-0 flex-col-reverse">
                <dt className="text-xs leading-snug text-gray-500">{fact.label}</dt>
                <dd className="text-lg font-bold leading-tight text-gray-900">{fact.value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      <div className="max-w-xs">
        <Segmented<"steps" | "all">
          name="guide-mode"
          legend={t("guides.stepByStep")}
          value={mode}
          onChange={(next) => {
            speech.stop();
            setMode(next);
          }}
          options={[
            { value: "steps", label: t("guides.stepByStep"), icon: "👆" },
            { value: "all", label: t("guides.allSteps"), icon: "📋" },
          ]}
        />
      </div>

      {mode === "steps" ? (
        <section
          className={`${card} overflow-hidden`}
          // Swipe left or right on a phone to move between steps
          onTouchStart={(event) => {
            touchStart.current = event.touches[0].clientX;
          }}
          onTouchEnd={(event) => {
            if (touchStart.current === null) return;
            const dx = event.changedTouches[0].clientX - touchStart.current;
            touchStart.current = null;
            if (dx < -50) go(current + 1);
            if (dx > 50) go(current - 1);
          }}
        >
          {/* Where you are: "Step 3 of 9" and a dot for each step */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-emerald-700">
              {finished ? "🎉" : t("stepOf", { n: current + 1, total })}
            </p>
            {!finished && speech.supported && (
              <button
                type="button"
                onClick={listen}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  speech.speaking
                    ? "bg-amber-100 text-amber-900"
                    : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                }`}
              >
                {speech.speaking ? (
                  <StopIcon className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <SpeakerWaveIcon className="h-5 w-5" aria-hidden="true" />
                )}
                {speech.speaking ? t("guides.stop") : t("guides.listen")}
              </button>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {guide.steps.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={t("guides.goToStep", { n: i + 1 })}
                aria-current={i === current ? "step" : undefined}
                className={`h-2.5 rounded-full transition-all ${
                  i === current ? "w-8 bg-emerald-600" : i < current ? "w-2.5 bg-emerald-300" : "w-2.5 bg-gray-200"
                }`}
              />
            ))}
          </div>

          <div className="py-8" aria-live="polite">
            {finished ? (
              <div className="animate-fade-up text-center">
                <span aria-hidden="true" className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-amber-50 text-6xl">
                  🎉
                </span>
                <h2 className="mt-5 text-2xl font-bold text-gray-900 sm:text-3xl">{t("guides.done")}</h2>
                <p className="mt-3 text-lg text-gray-700">{t("guides.doneText")}</p>
              </div>
            ) : (
              // Re-keyed per step so each one animates in
              <StepCard key={current} step={step} n={current + 1} />
            )}
          </div>

          {/* Big buttons, easy to hit with a thumb */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => go(current - 1)}
              disabled={current === 0}
              className="flex items-center justify-center gap-2 rounded-2xl bg-gray-100 px-4 py-4 text-base font-semibold text-gray-800 transition hover:bg-gray-200 disabled:opacity-40"
            >
              <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
              {t("back")}
            </button>
            {finished ? (
              <button
                type="button"
                onClick={() => go(0)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-4 text-base font-semibold text-white transition hover:bg-emerald-700"
              >
                ↺ {t("guides.startAgain")}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => go(current + 1)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-4 text-base font-semibold text-white transition hover:bg-emerald-700"
              >
                {t("next")}
                <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </div>
        </section>
      ) : (
        <ol className="space-y-3">
          {guide.steps.map((s, i) => (
            <li key={i} className={`${card} flex gap-4`}>
              <span
                aria-hidden="true"
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-3xl"
              >
                {s.icon}
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  {t("stepN", { n: i + 1 })}
                </p>
                <h2 className="text-lg font-semibold text-gray-900">{l(s.title)}</h2>
                <ul className="mt-2 space-y-1.5">
                  {sentences(l(s.text)).map((sentence, j) => (
                    <li key={j} className="flex gap-2 text-base leading-relaxed text-gray-700">
                      <span aria-hidden="true" className="text-emerald-600">✓</span>
                      <span>
                        <ProductText text={sentence} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      )}

      <section className={card}>
        <h2 className={subheading}>🛒 {t("guides.recommended")}</h2>
        <ProductTable
          lines={guide.products.map((productId) => ({ productId, qty: 1 }))}
          addButtons
        />
      </section>
    </div>
  );
}
