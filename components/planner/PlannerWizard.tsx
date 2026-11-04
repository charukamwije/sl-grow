"use client";

import { useMemo, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from "@heroicons/react/20/solid";
import { useCatalog } from "@/contexts/catalog-context";
import { useLanguage } from "@/contexts/language-context";
import { useNotification } from "@/contexts/notification-context";
import { VEGETABLES } from "@/lib/data/vegetables";
import type { StringKey } from "@/lib/i18n/strings";
import {
  computePlan,
  toAmount,
  type PlannerInputs,
} from "@/lib/planner/calc";
import NumberStepper from "../ui/NumberStepper";
import StepIndicator from "../ui/StepIndicator";
import {
  btnPrimary,
  btnSecondary,
  card,
  chip,
  eyebrow,
  heading,
  muted,
} from "../ui/styles";
import PlanResults from "./PlanResults";

// Form fields stay strings while typing, so clearing a box does not snap it
// back to 0; `toAmount` turns empty or invalid text into 0 (FR-P-07)
type FormState = {
  people: string;
  space: string;
  veg: Record<string, { selected: boolean; price: string; grams: string }>;
};

const STEPS: StringKey[] = ["step.home", "step.vegetables", "step.amounts", "step.plan"];

const SPACE_PRESETS: { key: StringKey; sqft: number; icon: string }[] = [
  { key: "preset.balcony", sqft: 30, icon: "🪴" },
  { key: "preset.rooftop", sqft: 60, icon: "🏠" },
  { key: "preset.yard", sqft: 120, icon: "🌿" },
  { key: "preset.garden", sqft: 250, icon: "🌳" },
];
const SPACE_SLIDER_MAX = 400;

function initialForm(): FormState {
  return {
    people: "4",
    space: "60",
    veg: Object.fromEntries(
      VEGETABLES.map((veg) => [
        veg.id,
        {
          selected: true,
          price: String(veg.price),
          grams: String(veg.gramsPerWeek),
        },
      ])
    ),
  };
}

function toInputs(form: FormState): PlannerInputs {
  return {
    people: Math.max(1, Math.floor(toAmount(form.people))),
    space: toAmount(form.space),
    veg: Object.fromEntries(
      Object.entries(form.veg).map(([id, v]) => [
        id,
        {
          selected: v.selected,
          price: toAmount(v.price),
          gramsPerWeek: toAmount(v.grams),
        },
      ])
    ),
  };
}


/**
 * The planner, one step at a time (SRS 3.1): home, vegetables, amounts and
 * prices, then the plan. Next is blocked while the space is 0 or no
 * vegetable is ticked.
 */
export default function PlannerWizard() {
  const { t, l } = useLanguage();
  const { addErrorNotification } = useNotification();
  const catalog = useCatalog();
  const vegIcon = (id: string) => catalog.seedlingFor(id)?.icon ?? "🌱";
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);

  const inputs = useMemo(() => toInputs(form), [form]);
  const plan = useMemo(
    () => (step === 3 ? computePlan(inputs, catalog) : null),
    [step, inputs, catalog]
  );
  const selected = VEGETABLES.filter((veg) => form.veg[veg.id].selected);

  const setVeg = (id: string, patch: Partial<FormState["veg"][string]>) =>
    setForm((prev) => ({
      ...prev,
      veg: { ...prev.veg, [id]: { ...prev.veg[id], ...patch } },
    }));

  const selectAll = (value: boolean) =>
    setForm((prev) => ({
      ...prev,
      veg: Object.fromEntries(
        Object.entries(prev.veg).map(([id, v]) => [id, { ...v, selected: value }])
      ),
    }));

  const goTo = (next: number) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const next = () => {
    if (step === 0 && inputs.space <= 0) {
      addErrorNotification(t("needSpace"));
      return;
    }
    if (step === 1 && selected.length === 0) {
      addErrorNotification(t("needVeg"));
      return;
    }
    goTo(Math.min(step + 1, STEPS.length - 1));
  };

  const back = () => goTo(Math.max(step - 1, 0));

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className={eyebrow}>🌱 {t("tagline")}</p>
        <h1 className={heading}>{t("planner.title")}</h1>
        <p className={`${muted} max-w-2xl`}>{t("planner.intro")}</p>
      </header>

      <StepIndicator
        steps={STEPS.map((key) => t(key))}
        current={step}
        label={t("stepOf", { n: step + 1, total: STEPS.length })}
        onSelect={goTo}
      />

      {step === 0 && (
        <section className="grid gap-4 md:grid-cols-2">
          <div className={`${card} flex flex-col gap-5`}>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-2xl">
                👨‍👩‍👧‍👦
              </span>
              <h2 className="font-semibold text-gray-900">{t("people")}</h2>
            </div>
            <NumberStepper
              id="people"
              label={t("people")}
              value={form.people}
              min={1}
              max={30}
              onChange={(people) => setForm((prev) => ({ ...prev, people }))}
            />
            <p
              className="flex flex-wrap justify-center gap-1 text-xl sm:text-2xl"
              aria-hidden="true"
            >
              {Array.from(
                { length: Math.min(Math.max(1, Math.floor(toAmount(form.people))), 10) },
                (_, i) => (
                  <span key={i}>🧑</span>
                )
              )}
            </p>
          </div>

          <div className={`${card} flex flex-col gap-5`}>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
                📐
              </span>
              <div>
                <h2 className="font-semibold text-gray-900">{t("space")}</h2>
                <p className="text-xs text-gray-500">{t("spaceHint")}</p>
              </div>
            </div>
            <NumberStepper
              id="space"
              label={t("space")}
              value={form.space}
              step={5}
              unit="sq ft"
              onChange={(space) => setForm((prev) => ({ ...prev, space }))}
            />
            <input
              type="range"
              min={0}
              max={SPACE_SLIDER_MAX}
              step={5}
              value={Math.min(toAmount(form.space), SPACE_SLIDER_MAX)}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, space: event.target.value }))
              }
              aria-label={`${t("space")} – slider`}
              className="w-full accent-emerald-600"
            />
            <div className="flex flex-wrap gap-2">
              {SPACE_PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  className={chip(toAmount(form.space) === preset.sqft)}
                  onClick={() =>
                    setForm((prev) => ({ ...prev, space: String(preset.sqft) }))
                  }
                >
                  {preset.icon} {t(preset.key)} · {preset.sqft}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-gray-900">{t("chooseVeg")}</p>
              <p className={muted}>{t("selectedCount", { n: selected.length })}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" className={chip(false)} onClick={() => selectAll(true)}>
                {t("selectAll")}
              </button>
              <button type="button" className={chip(false)} onClick={() => selectAll(false)}>
                {t("selectNone")}
              </button>
            </div>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {VEGETABLES.map((veg) => {
              const isOn = form.veg[veg.id].selected;
              return (
                <li key={veg.id}>
                  <label
                    className={`relative flex h-full cursor-pointer flex-col items-center gap-2 rounded-3xl p-4 text-center transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 ${
                      isOn
                        ? "bg-emerald-50 ring-2 ring-emerald-500"
                        : "bg-white ring-1 ring-black/5 hover:ring-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isOn}
                      onChange={(event) =>
                        setVeg(veg.id, { selected: event.target.checked })
                      }
                      className="sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={`absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full transition ${
                        isOn ? "bg-emerald-600 text-white" : "bg-gray-100 text-transparent"
                      }`}
                    >
                      <CheckIcon className="h-4 w-4" />
                    </span>
                    <span className="text-4xl" aria-hidden="true">
                      {vegIcon(veg.id)}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{l(veg.name)}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4">
          <p className={muted}>{t("amountsHint")}</p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {selected.map((veg) => {
              const name = l(veg.name);
              return (
                <li key={veg.id} className={`${card} !p-4 space-y-3`}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-2xl" aria-hidden="true">
                      {vegIcon(veg.id)}
                    </span>
                    <h3 className="font-semibold text-gray-900">{name}</h3>
                  </div>
                  {/* One row per value: label on the left, stepper on the
                      right, so it fits a 320 px screen without squeezing */}
                  <div className="space-y-2">
                    {[
                      {
                        key: "grams" as const,
                        unit: t("unit.gWeek"),
                        label: t("gramsPerWeek"),
                        step: 25,
                      },
                      {
                        key: "price" as const,
                        unit: t("unit.rsKg"),
                        label: t("pricePerKg"),
                        step: 50,
                      },
                    ].map((field) => (
                      <div
                        key={field.key}
                        className="flex items-center justify-between gap-2 rounded-2xl bg-gray-50 py-1.5 pl-3 pr-1.5"
                      >
                        <span className="min-w-0 text-xs font-medium text-gray-500">
                          {field.unit}
                        </span>
                        <div className="w-36 shrink-0">
                          <NumberStepper
                            id={`${field.key}-${veg.id}`}
                            label={`${name}: ${field.label}`}
                            value={form.veg[veg.id][field.key]}
                            step={field.step}
                            size="sm"
                            onChange={(value) =>
                              setVeg(
                                veg.id,
                                field.key === "grams" ? { grams: value } : { price: value }
                              )
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {step === 3 && plan && <PlanResults plan={plan} inputs={inputs} />}

      {/* Sticky action bar, within thumb reach on a phone */}
      <div className="sticky bottom-0 z-10 -mx-4 border-t border-black/5 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:mx-0 sm:rounded-3xl sm:border sm:shadow-lg">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          {step > 0 ? (
            <button type="button" className={btnSecondary} onClick={back}>
              <ArrowLeftIcon className="h-4 w-4" />
              {step === 3 ? t("startOver") : t("back")}
            </button>
          ) : (
            <span />
          )}
          {step < 2 && (
            <button type="button" className={btnPrimary} onClick={next}>
              {t("next")}
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          )}
          {step === 2 && (
            <button type="button" className={btnPrimary} onClick={next}>
              {t("calculate")}
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
