"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { useNotification } from "@/contexts/notification-context";
import { VEGETABLES } from "@/lib/data/vegetables";
import type { StringKey } from "@/lib/i18n/strings";
import {
  computePlan,
  toAmount,
  type PlannerInputs,
} from "@/lib/planner/calc";
import StepIndicator from "../ui/StepIndicator";
import {
  btnPrimary,
  btnSecondary,
  card,
  heading,
  input,
  label,
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
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);

  const inputs = useMemo(() => toInputs(form), [form]);
  const plan = useMemo(
    () => (step === 3 ? computePlan(inputs) : null),
    [step, inputs]
  );
  const selected = VEGETABLES.filter((veg) => form.veg[veg.id].selected);

  const setVeg = (
    id: string,
    patch: Partial<FormState["veg"][string]>
  ) =>
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

  const next = () => {
    if (step === 0 && inputs.space <= 0) {
      addErrorNotification(t("needSpace"));
      return;
    }
    if (step === 1 && selected.length === 0) {
      addErrorNotification(t("needVeg"));
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0 });
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="space-y-4">
      <div>
        <h1 className={heading}>{t("planner.title")}</h1>
        <p className={muted}>{t("planner.intro")}</p>
      </div>

      <StepIndicator
        steps={STEPS.map((key) => t(key))}
        current={step}
        label={t("stepOf", { n: step + 1, total: STEPS.length })}
      />

      {step === 0 && (
        <section className={`${card} grid gap-4 sm:grid-cols-2`}>
          <div>
            <label htmlFor="people" className={label}>
              {t("people")}
            </label>
            <input
              id="people"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              className={input}
              value={form.people}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, people: event.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="space" className={label}>
              {t("space")}
            </label>
            <input
              id="space"
              type="number"
              inputMode="decimal"
              min={0}
              className={input}
              value={form.space}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, space: event.target.value }))
              }
            />
            <p className={`${muted} mt-1`}>{t("spaceHint")}</p>
          </div>
        </section>
      )}

      {step === 1 && (
        <section className={`${card} space-y-3`}>
          <p className="text-gray-800">{t("chooseVeg")}</p>
          <div className="flex gap-2">
            <button type="button" className={btnSecondary} onClick={() => selectAll(true)}>
              {t("selectAll")}
            </button>
            <button type="button" className={btnSecondary} onClick={() => selectAll(false)}>
              {t("selectNone")}
            </button>
          </div>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {VEGETABLES.map((veg) => (
              <li key={veg.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-green-100 p-3 hover:bg-green-50">
                  <input
                    type="checkbox"
                    checked={form.veg[veg.id].selected}
                    onChange={(event) =>
                      setVeg(veg.id, { selected: event.target.checked })
                    }
                    className="h-5 w-5 accent-green-700"
                  />
                  <span>{l(veg.name)}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}

      {step === 2 && (
        <section className={`${card} space-y-3`}>
          <p className="text-gray-800">{t("amountsHint")}</p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t("col.vegetable")}</th>
                  <th>{t("gramsPerWeek")}</th>
                  <th>{t("pricePerKg")}</th>
                </tr>
              </thead>
              <tbody>
                {selected.map((veg) => (
                  <tr key={veg.id}>
                    <td>{l(veg.name)}</td>
                    <td>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        aria-label={`${l(veg.name)}: ${t("gramsPerWeek")}`}
                        className={`${input} w-24`}
                        value={form.veg[veg.id].grams}
                        onChange={(event) =>
                          setVeg(veg.id, { grams: event.target.value })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        aria-label={`${l(veg.name)}: ${t("pricePerKg")}`}
                        className={`${input} w-28`}
                        value={form.veg[veg.id].price}
                        onChange={(event) =>
                          setVeg(veg.id, { price: event.target.value })
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {step === 3 && plan && <PlanResults plan={plan} inputs={inputs} />}

      <div className="flex flex-wrap justify-between gap-2">
        {step > 0 ? (
          <button type="button" className={btnSecondary} onClick={back}>
            ← {step === 3 ? t("startOver") : t("back")}
          </button>
        ) : (
          <span />
        )}
        {step < 2 && (
          <button type="button" className={btnPrimary} onClick={next}>
            {t("next")} →
          </button>
        )}
        {step === 2 && (
          <button type="button" className={btnPrimary} onClick={next}>
            {t("calculate")} →
          </button>
        )}
      </div>
    </div>
  );
}
