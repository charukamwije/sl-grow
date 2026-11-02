"use client";

import { useMemo, useState } from "react";
import { useNotification } from "@/contexts/notification-context";
import {
  CROPS,
  DEFAULT_DISCOUNT_RATE,
  DEFAULT_YEARS,
  HECTARE_IN_ACRES,
  MAX_YEARS,
  MIN_YEARS,
  type CropId,
  type PlantationAssumptions,
} from "@/lib/data/plantation";
import { buildEnquiryMessage, waLink } from "@/lib/order/whatsapp";
import { toAmount } from "@/lib/planner/calc";
import { computePlantation } from "@/lib/plantation/calc";
import { formatLKR, formatNumber } from "@/lib/products";
import { isPlaceholderNumber } from "@/lib/shop-config";
import StepIndicator from "../ui/StepIndicator";
import {
  btnPrimary,
  btnSecondary,
  card,
  heading,
  input,
  label,
  muted,
  subheading,
} from "../ui/styles";

// The Plantation section is English only until it is translated (OI-20)
const STEPS = ["Choose the crop", "Land size", "Your result", "How to grow"];

type AssumptionField = {
  key: keyof PlantationAssumptions;
  label: string;
};

const ASSUMPTION_FIELDS: AssumptionField[] = [
  { key: "setupCost", label: "Setup cost (LKR per ha)" },
  { key: "upkeepBefore", label: "Upkeep before first harvest (LKR per ha per year)" },
  { key: "upkeepAfter", label: "Upkeep from first harvest (LKR per ha per year)" },
  { key: "yieldKg", label: "Yield at full production (kg per ha per year)" },
  { key: "price", label: "Price (LKR per kg)" },
  { key: "firstHarvestYear", label: "First harvest year" },
  { key: "workersPerHa", label: "Workers per ha" },
];

type Assumptions = Record<keyof PlantationAssumptions, string>;

function toStrings(a: PlantationAssumptions): Assumptions {
  return Object.fromEntries(
    Object.entries(a).map(([key, value]) => [key, String(value)])
  ) as Assumptions;
}

function Disclaimer() {
  return (
    <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
      ⚠️ These figures are planning estimates based on placeholder assumptions
      that have not been checked. They are not financial or agricultural
      advice. Confirm costs, yields and prices with the Sri Lanka Tea Board,
      the Export Development Board, the Tea Research Institute, an agronomist
      and an accountant before investing.
    </p>
  );
}

/**
 * Plantation investment, one step at a time (SRS 3.14): crop, land size,
 * result with an enquiry, then how to grow the crop.
 */
export default function PlantationWizard() {
  const { addErrorNotification, addInfoNotification } = useNotification();
  const [step, setStep] = useState(0);
  const [cropId, setCropId] = useState<CropId | null>(null);
  const [land, setLand] = useState("1");
  const [unit, setUnit] = useState<"ha" | "acre">("ha");
  const [rate, setRate] = useState(String(DEFAULT_DISCOUNT_RATE * 100));
  const [years, setYears] = useState(String(DEFAULT_YEARS));
  const [assumptions, setAssumptions] = useState<Record<CropId, Assumptions>>(
    () =>
      Object.fromEntries(
        CROPS.map((crop) => [crop.id, toStrings(crop.defaults)])
      ) as Record<CropId, Assumptions>
  );
  const [guideStep, setGuideStep] = useState(0);

  const crop = CROPS.find((c) => c.id === cropId) ?? null;
  const landValue = toAmount(land);
  const hectares = unit === "ha" ? landValue : landValue / HECTARE_IN_ACRES;
  const acres = hectares * HECTARE_IN_ACRES;
  const period = Math.min(
    MAX_YEARS,
    Math.max(MIN_YEARS, Math.round(toAmount(years) || DEFAULT_YEARS))
  );

  // FR-I-05: every input feeds straight into the result
  const result = useMemo(() => {
    if (!crop) return null;
    const a = assumptions[crop.id];
    return computePlantation({
      hectares,
      rate: toAmount(rate) / 100,
      years: period,
      assumptions: {
        setupCost: toAmount(a.setupCost),
        upkeepBefore: toAmount(a.upkeepBefore),
        upkeepAfter: toAmount(a.upkeepAfter),
        yieldKg: toAmount(a.yieldKg),
        price: toAmount(a.price),
        firstHarvestYear: Math.max(1, Math.round(toAmount(a.firstHarvestYear))),
        workersPerHa: toAmount(a.workersPerHa),
      },
    });
  }, [crop, assumptions, hectares, rate, period]);

  const next = () => {
    if (step === 0 && !crop) {
      addErrorNotification("Please choose a crop.");
      return;
    }
    if (step === 1 && landValue <= 0) {
      addErrorNotification("Please enter a land size greater than 0.");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0 });
  };

  // FR-I-07
  const sendEnquiry = () => {
    if (!crop) return;
    window.open(
      waLink(buildEnquiryMessage(crop.name, hectares, acres)),
      "_blank",
      "noopener"
    );
    addInfoNotification("WhatsApp opened with your enquiry. Press send there.");
  };

  const setAssumption = (key: keyof PlantationAssumptions, value: string) => {
    if (!crop) return;
    setAssumptions((prev) => ({
      ...prev,
      [crop.id]: { ...prev[crop.id], [key]: value },
    }));
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className={heading}>Plantation investment</h1>
        <p className={muted}>
          See what planting Ceylon cinnamon or tea could cost and earn.
        </p>
      </div>

      <StepIndicator
        steps={STEPS}
        current={step}
        label={`Step ${step + 1} of ${STEPS.length}`}
      />

      <Disclaimer />

      {step === 0 && (
        <section className={`${card} grid gap-3 sm:grid-cols-2`}>
          {CROPS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCropId(c.id)}
              aria-pressed={cropId === c.id}
              className={`rounded-xl border-2 p-4 text-left transition ${
                cropId === c.id
                  ? "border-green-700 bg-green-50"
                  : "border-green-100 hover:border-green-300"
              }`}
            >
              <span className="text-3xl" aria-hidden="true">
                {c.icon}
              </span>
              <span className="mt-2 block text-lg font-semibold">{c.name}</span>
              <span className="text-sm text-gray-600">Sold as {c.product}</span>
            </button>
          ))}
        </section>
      )}

      {step === 1 && (
        <section className={`${card} space-y-3`}>
          <label htmlFor="land" className={label}>
            Land size
          </label>
          <div className="flex gap-2">
            <input
              id="land"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              className={`${input} max-w-40`}
              value={land}
              onChange={(event) => setLand(event.target.value)}
            />
            <select
              aria-label="Unit"
              className={`${input} w-auto`}
              value={unit}
              onChange={(event) => setUnit(event.target.value as "ha" | "acre")}
            >
              <option value="ha">hectares</option>
              <option value="acre">acres</option>
            </select>
          </div>
          <p className={muted}>
            = {formatNumber(hectares, 2)} ha = {formatNumber(acres, 2)} acres (1
            ha = {HECTARE_IN_ACRES} acres)
          </p>
        </section>
      )}

      {step === 2 && crop && result && (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-live="polite">
            {[
              ["Setup investment", formatLKR(result.setupInvestment)],
              [
                "Payback year",
                result.paybackYear === null
                  ? `Not within ${period} years`
                  : `Year ${result.paybackYear}`,
              ],
              [`NPV at ${formatNumber(toAmount(rate))}%`, formatLKR(result.npv)],
              [
                "IRR",
                result.irr === null ? "None" : `${formatNumber(result.irr * 100)}%`,
              ],
            ].map(([term, value]) => (
              <div key={term} className="rounded-xl bg-green-800 p-4 text-white">
                <p className="text-xs opacity-90">{term}</p>
                <p className="text-lg font-bold">{value}</p>
              </div>
            ))}
          </section>

          <section className={`${card} grid gap-2 text-sm sm:grid-cols-2`}>
            <p>
              <strong>Break-even price:</strong>{" "}
              {result.breakEvenPrice === null
                ? "No harvest in this period"
                : `${formatLKR(result.breakEvenPrice)} per kg of ${crop.product}`}
            </p>
            <p>
              <strong>Workers needed:</strong> {formatNumber(result.workers)}
            </p>
            <p className="sm:col-span-2 text-gray-600">
              {crop.name} on {formatNumber(hectares, 2)} ha (
              {formatNumber(acres, 2)} acres), over {period} years.
            </p>
          </section>

          <details className={card}>
            <summary className="cursor-pointer font-semibold text-green-900">
              Advanced settings
            </summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="rate" className={label}>
                  Discount rate (%)
                </label>
                <input
                  id="rate"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  className={input}
                  value={rate}
                  onChange={(event) => setRate(event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="years" className={label}>
                  Analysis period ({MIN_YEARS} to {MAX_YEARS} years)
                </label>
                <input
                  id="years"
                  type="number"
                  inputMode="numeric"
                  min={MIN_YEARS}
                  max={MAX_YEARS}
                  className={input}
                  value={years}
                  onChange={(event) => setYears(event.target.value)}
                />
              </div>
              {ASSUMPTION_FIELDS.map((field) => (
                <div key={field.key}>
                  <label htmlFor={`a-${field.key}`} className={label}>
                    {field.label}
                  </label>
                  <input
                    id={`a-${field.key}`}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="any"
                    className={input}
                    value={assumptions[crop.id][field.key]}
                    onChange={(event) =>
                      setAssumption(field.key, event.target.value)
                    }
                  />
                </div>
              ))}
              <div className="sm:col-span-2">
                <button
                  type="button"
                  className={btnSecondary}
                  onClick={() =>
                    setAssumptions((prev) => ({
                      ...prev,
                      [crop.id]: toStrings(crop.defaults),
                    }))
                  }
                >
                  Reset to defaults
                </button>
              </div>
            </div>
          </details>

          <section className={card}>
            <h2 className={subheading}>Money by year</h2>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Year</th>
                    <th className="num">Revenue</th>
                    <th className="num">Costs</th>
                    <th className="num">Net cash</th>
                    <th className="num">Cumulative</th>
                  </tr>
                </thead>
                <tbody>
                  {result.table.map((row) => (
                    <tr key={row.year}>
                      <td>{row.year}</td>
                      <td className="num">{formatLKR(row.revenue)}</td>
                      <td className="num">{formatLKR(row.upkeep + row.setup)}</td>
                      <td className={`num ${row.net < 0 ? "text-red-700" : ""}`}>
                        {formatLKR(row.net)}
                      </td>
                      <td
                        className={`num ${row.cumulative < 0 ? "text-red-700" : "text-green-800"}`}
                      >
                        {formatLKR(row.cumulative)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={`${card} space-y-2`}>
            <h2 className={subheading}>Talk to us</h2>
            <p className={muted}>
              Send the shop your crop and land size on WhatsApp to ask about
              planting material and setup.
            </p>
            {isPlaceholderNumber() && (
              <p className="text-sm text-amber-800">
                The shop&apos;s WhatsApp number has not been set yet.
              </p>
            )}
            <button type="button" className={btnPrimary} onClick={sendEnquiry}>
              💬 Send enquiry on WhatsApp
            </button>
          </section>
        </>
      )}

      {step === 3 && crop && (
        <section className={`${card} space-y-4`}>
          <p className="text-sm font-semibold text-green-800">
            {crop.name}: step {guideStep + 1} of {crop.steps.length}
          </p>
          <div>
            <h2 className={subheading}>{crop.steps[guideStep].title}</h2>
            <p className="text-gray-800">{crop.steps[guideStep].text}</p>
          </div>
          <div className="flex justify-between gap-2">
            <button
              type="button"
              className={btnSecondary}
              disabled={guideStep === 0}
              onClick={() => setGuideStep((s) => Math.max(0, s - 1))}
            >
              ← Previous
            </button>
            <button
              type="button"
              className={btnSecondary}
              disabled={guideStep === crop.steps.length - 1}
              onClick={() =>
                setGuideStep((s) => Math.min(crop.steps.length - 1, s + 1))
              }
            >
              Next step →
            </button>
          </div>
        </section>
      )}

      <div className="flex flex-wrap justify-between gap-2">
        {step > 0 ? (
          <button
            type="button"
            className={btnSecondary}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            ← Back
          </button>
        ) : (
          <span />
        )}
        {step < STEPS.length - 1 && (
          <button type="button" className={btnPrimary} onClick={next}>
            {step === 2 ? "How to grow it" : "Next"} →
          </button>
        )}
      </div>
    </div>
  );
}
