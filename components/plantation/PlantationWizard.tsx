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
import {
  betterCrop,
  bestDistricts,
  DISTRICTS,
  isDistrict,
  RATINGS,
  suitability,
  type District,
  type Rating,
} from "@/lib/data/districts";
import { buildEnquiryMessage, waLink } from "@/lib/order/whatsapp";
import { toAmount } from "@/lib/planner/calc";
import { computePlantation } from "@/lib/plantation/calc";
import { formatLKR, formatNumber } from "@/lib/products";
import { isPlaceholderNumber } from "@/lib/shop-config";
import NumberStepper from "../ui/NumberStepper";
import Segmented from "../ui/Segmented";
import StepIndicator from "../ui/StepIndicator";
import {
  btnPrimary,
  btnSecondary,
  card,
  heading,
  input,
  label,
  muted,
  eyebrow,
  subheading,
} from "../ui/styles";

// The Plantation section is English only until it is translated (OI-20)
const STEPS = ["Choose the crop", "Your land", "Your result", "How to grow"];

// The verdict's colours: green to red as the district suits the crop less
const RATING_STYLE: Record<Rating, { box: string; badge: string; icon: string }> = {
  suitable: { box: "bg-emerald-50 ring-emerald-200 text-emerald-950", badge: "bg-emerald-600 text-white", icon: "✅" },
  moderate: { box: "bg-amber-50 ring-amber-200 text-amber-950", badge: "bg-amber-500 text-white", icon: "⚠️" },
  marginal: { box: "bg-orange-50 ring-orange-200 text-orange-950", badge: "bg-orange-600 text-white", icon: "⚠️" },
  unsuitable: { box: "bg-red-50 ring-red-200 text-red-950", badge: "bg-red-600 text-white", icon: "⛔" },
};

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
    <p className="rounded-2xl bg-amber-50 p-4 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-200">
      ⚠️ These figures are planning estimates based on placeholder assumptions
      that have not been checked. They are not financial or agricultural
      advice. Confirm costs, yields and prices with the Sri Lanka Tea Board,
      the Export Development Board, the Tea Research Institute, an agronomist
      and an accountant before investing.
    </p>
  );
}

/** Whether the crop suits the district, why, and what to do instead */
function Verdict({
  cropId,
  cropName,
  district,
  rating,
  reason,
  onSwitch,
}: {
  cropId: CropId;
  cropName: string;
  district: District;
  rating: Rating;
  reason: string;
  onSwitch: (crop: CropId) => void;
}) {
  const style = RATING_STYLE[rating];
  const other = betterCrop(cropId, district);
  const otherCrop = other ? CROPS.find((c) => c.id === other)! : null;
  const elsewhere = bestDistricts(cropId);

  return (
    <section className={`space-y-3 rounded-3xl p-5 ring-1 sm:p-6 ${style.box}`} aria-live="polite">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-2xl" aria-hidden="true">
          {style.icon}
        </span>
        <h2 className="text-lg font-bold">
          {cropName} in {district}
        </h2>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${style.badge}`}>
          {RATINGS[rating].label}
        </span>
      </div>
      <p className="text-sm leading-relaxed">{reason}</p>
      {rating === "unsuitable" && (
        <p className="text-sm font-semibold">
          We do not recommend planting {cropName.split(" ")[0].toLowerCase()} here: the figures
          below assume no saleable harvest.
        </p>
      )}
      {rating !== "suitable" && (
        <div className="space-y-2 border-t border-black/10 pt-3 text-sm">
          {otherCrop && (
            <p className="flex flex-wrap items-center gap-2">
              <span>
                {otherCrop.icon} <strong>{otherCrop.name}</strong> suits {district} better.
              </span>
              <button
                type="button"
                onClick={() => onSwitch(otherCrop.id)}
                className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-300 hover:bg-emerald-50"
              >
                See {otherCrop.name.split(" ")[0].toLowerCase()} figures
              </button>
            </p>
          )}
          <p>
            {cropName} grows best in: {elsewhere.join(", ")}.
          </p>
        </div>
      )}
      <p className="text-xs opacity-80">
        A district-wide guide: rainfall, elevation and soil change within a district. Check your
        own land with the{" "}
        {cropId === "tea" ? "Tea Research Institute or TSHDA" : "Department of Export Agriculture"}{" "}
        before investing.
      </p>
    </section>
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
  const [district, setDistrict] = useState<District | "">("");
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
  const fit = crop && district ? suitability(crop.id, district) : null;
  // The district scales the full yield, so the figures agree with the verdict
  const yieldFactor = fit ? RATINGS[fit.rating].yieldFactor : 1;
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
        yieldKg: toAmount(a.yieldKg) * yieldFactor,
        price: toAmount(a.price),
        firstHarvestYear: Math.max(1, Math.round(toAmount(a.firstHarvestYear))),
        workersPerHa: toAmount(a.workersPerHa),
      },
    });
  }, [crop, assumptions, hectares, rate, period, yieldFactor]);

  const next = () => {
    if (step === 0 && !crop) {
      addErrorNotification("Please choose a crop.");
      return;
    }
    if (step === 1 && !district) {
      addErrorNotification("Please choose the district your land is in.");
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
      waLink(buildEnquiryMessage(crop.name, hectares, acres, district || undefined)),
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
    <div className="space-y-6">
      <header className="space-y-2">
        <p className={eyebrow}>🌴 Large-scale planting</p>
        <h1 className={heading}>Plantation investment</h1>
        <p className={muted}>
          See what planting Ceylon cinnamon or tea could cost and earn.
        </p>
      </header>

      <StepIndicator
        steps={STEPS}
        current={step}
        label={`Step ${step + 1} of ${STEPS.length}`}
        onSelect={setStep}
      />

      <Disclaimer />

      {step === 0 && (
        <section className="grid gap-4 sm:grid-cols-2">
          {CROPS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCropId(c.id)}
              aria-pressed={cropId === c.id}
              className={`relative flex flex-col items-start gap-2 rounded-3xl p-6 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                cropId === c.id
                  ? "bg-emerald-50 ring-2 ring-emerald-500"
                  : "bg-white shadow-sm ring-1 ring-black/5 hover:ring-gray-300"
              }`}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-4xl shadow-sm" aria-hidden="true">
                {c.icon}
              </span>
              <span className="text-lg font-semibold text-gray-900">{c.name}</span>
              <span className="text-sm text-gray-500">Sold as {c.product}</span>
              {cropId === c.id && (
                <span className="absolute right-4 top-4 rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                  Selected
                </span>
              )}
            </button>
          ))}
        </section>
      )}

      {step === 1 && (
        <section className={`${card} mx-auto max-w-md space-y-5`}>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
              🗺️
            </span>
            <h2 className="font-semibold text-gray-900">Where is your land, and how much?</h2>
          </div>
          <div>
            <label htmlFor="district" className={label}>
              District
            </label>
            <select
              id="district"
              className={input}
              value={district}
              onChange={(event) => setDistrict(isDistrict(event.target.value) ? event.target.value : "")}
            >
              <option value="">Choose a district…</option>
              {DISTRICTS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            {fit && crop && (
              <p className="mt-1.5 px-1 text-xs text-gray-600">
                {RATING_STYLE[fit.rating].icon} {crop.name} in {district}:{" "}
                <strong>{RATINGS[fit.rating].label}</strong>
              </p>
            )}
          </div>
          <Segmented<"ha" | "acre">
            name="land-unit"
            legend="Unit"
            value={unit}
            onChange={setUnit}
            options={[
              { value: "ha", label: "Hectares" },
              { value: "acre", label: "Acres" },
            ]}
          />
          <NumberStepper
            id="land"
            label="Land size"
            value={land}
            step={0.5}
            unit={unit === "ha" ? "ha" : "acres"}
            onChange={setLand}
          />
          <p className="rounded-2xl bg-gray-50 p-3 text-center text-sm text-gray-600">
            = {formatNumber(hectares, 2)} ha = {formatNumber(acres, 2)} acres
            <span className="block text-xs text-gray-400">
              1 ha = {HECTARE_IN_ACRES} acres
            </span>
          </p>
        </section>
      )}

      {step === 2 && crop && result && (
        <>
          {fit && district && (
            <Verdict
              cropId={crop.id}
              cropName={crop.name}
              district={district}
              rating={fit.rating}
              reason={fit.reason}
              onSwitch={(id) => setCropId(id)}
            />
          )}
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
              <div key={term} className="rounded-3xl bg-gradient-to-br from-emerald-600 to-green-800 p-4 text-white shadow-sm">
                <p className="text-xs opacity-90">{term}</p>
                <p className="break-words text-base font-bold sm:text-lg">{value}</p>
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
              {formatNumber(acres, 2)} acres){district && ` in ${district}`}, over {period} years.
              {yieldFactor === 0
                ? " No saleable harvest is assumed for this district."
                : yieldFactor < 1 &&
                  ` Harvests are set to ${Math.round(yieldFactor * 100)}% of the full yield for this district.`}
            </p>
          </section>

          <details className={card}>
            <summary className="cursor-pointer font-semibold text-gray-900">
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
                        className={`num ${row.cumulative < 0 ? "text-red-700" : "text-emerald-700"}`}
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
          <p className="text-sm font-semibold text-emerald-700">
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

      {/* Sticky action bar, within thumb reach on a phone */}
      <div className="sticky bottom-0 z-10 -mx-4 border-t border-black/5 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:mx-0 sm:rounded-3xl sm:border sm:shadow-lg">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
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
    </div>
  );
}
