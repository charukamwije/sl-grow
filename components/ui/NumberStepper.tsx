"use client";

import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import { toAmount } from "@/lib/planner/calc";

type NumberStepperProps = {
  id: string;
  /** Accessible name of the number box */
  label: string;
  value: string;
  onChange: (value: string) => void;
  step?: number;
  min?: number;
  max?: number;
  /** Shown after the number, e.g. "sq ft" */
  unit?: string;
  size?: "lg" | "sm";
  /** Visible label above; hidden when the surrounding card already says it */
  showLabel?: boolean;
};

/**
 * A number you change with big − / + buttons and can still type into.
 * Easier on a phone than a bare number box, and the value stays a string
 * while typing so clearing the box does not snap it back to 0.
 */
export default function NumberStepper({
  id,
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  unit,
  size = "lg",
  showLabel = false,
}: NumberStepperProps) {
  const current = toAmount(value);
  const nudge = (delta: number) => {
    const next = Math.min(max, Math.max(min, current + delta));
    onChange(String(Math.round(next * 100) / 100));
  };

  const big = size === "lg";
  const button = `flex shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 active:scale-90 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
    big ? "h-12 w-12" : "h-9 w-9"
  }`;

  return (
    <div>
      <label
        htmlFor={id}
        className={showLabel ? "mb-1.5 block text-xs font-medium text-gray-500" : "sr-only"}
      >
        {label}
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={button}
          onClick={() => nudge(-step)}
          disabled={current <= min}
          aria-label={`− ${label}`}
        >
          <MinusIcon className={big ? "h-5 w-5" : "h-4 w-4"} />
        </button>
        <div className="flex min-w-0 flex-1 items-baseline justify-center gap-1">
          <input
            id={id}
            type="number"
            inputMode="decimal"
            min={min}
            max={max === Number.MAX_SAFE_INTEGER ? undefined : max}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className={`w-full min-w-0 appearance-none border-0 bg-transparent p-0 text-center font-bold text-gray-900 focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
              big ? "text-4xl" : "text-lg"
            }`}
          />
          {unit && (
            <span className={`shrink-0 text-gray-500 ${big ? "text-base" : "text-xs"}`}>
              {unit}
            </span>
          )}
        </div>
        <button
          type="button"
          className={button}
          onClick={() => nudge(step)}
          disabled={current >= max}
          aria-label={`+ ${label}`}
        >
          <PlusIcon className={big ? "h-5 w-5" : "h-4 w-4"} />
        </button>
      </div>
    </div>
  );
}
