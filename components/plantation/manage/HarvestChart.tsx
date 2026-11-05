"use client";

import { useState } from "react";
import type { MonthTotal } from "@/lib/plantation/records";
import { formatNumber } from "@/lib/products";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const HEIGHT = 140;

/**
 * Kg harvested in each month of the year: one series, so one hue and no
 * legend (the title names it). Columns sit on a shared baseline with rounded
 * tops; hovering or focusing a month shows its value. A table holds the same
 * numbers for screen readers and anyone who prefers one.
 */
export default function HarvestChart({ months, year }: { months: MonthTotal[]; year: number }) {
  const [active, setActive] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const max = Math.max(...months.map((entry) => entry.kg));
  const peak = months.findIndex((entry) => entry.kg === max && max > 0);

  return (
    <figure className="space-y-3">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-gray-900">Harvest by month, {year} (kg)</span>
        <button
          type="button"
          onClick={() => setAsTable((value) => !value)}
          className="text-xs font-medium text-emerald-700 hover:underline"
        >
          {asTable ? "Show chart" : "Show as table"}
        </button>
      </figcaption>

      {max === 0 ? (
        <p className="rounded-2xl bg-gray-50 p-4 text-center text-sm text-gray-500">
          No harvest recorded in {year} yet.
        </p>
      ) : asTable ? (
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-gray-500">
            <tr>
              <th className="py-1 font-medium">Month</th>
              <th className="py-1 text-right font-medium">Kg</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {months.map((entry) => (
              <tr key={entry.month}>
                <td className="py-1.5 text-gray-700">{MONTHS[entry.month]}</td>
                <td className="py-1.5 text-right tabular-nums text-gray-900">{formatNumber(entry.kg, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div aria-hidden="true">
          <div className="relative flex items-end gap-[2px] border-b border-gray-200" style={{ height: HEIGHT }}>
            {months.map((entry) => {
              const height = entry.kg > 0 ? Math.max(4, (entry.kg / max) * (HEIGHT - 20)) : 0;
              const dim = active !== null && active !== entry.month;
              return (
                <div
                  key={entry.month}
                  className="relative flex h-full flex-1 items-end justify-center"
                  onMouseEnter={() => setActive(entry.month)}
                  onMouseLeave={() => setActive(null)}
                >
                  {(active === entry.month || (active === null && entry.month === peak)) && entry.kg > 0 && (
                    <span
                      className="absolute z-10 whitespace-nowrap rounded-lg bg-gray-900 px-2 py-1 text-xs font-medium text-white shadow"
                      style={{ bottom: height + 6 }}
                    >
                      {MONTHS[entry.month]} · {formatNumber(entry.kg, 0)} kg
                    </span>
                  )}
                  <div
                    className={`w-full max-w-8 rounded-t bg-emerald-600 transition-opacity ${dim ? "opacity-40" : ""}`}
                    style={{ height }}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-1 flex gap-[2px] text-center text-[10px] text-gray-500">
            {months.map((entry) => (
              <span key={entry.month} className="flex-1">
                {MONTHS[entry.month].slice(0, 1)}
                <span className="hidden sm:inline">{MONTHS[entry.month].slice(1)}</span>
              </span>
            ))}
          </div>
        </div>
      )}
      {max > 0 && !asTable && (
        <p className="sr-only">
          {months
            .filter((entry) => entry.kg > 0)
            .map((entry) => `${MONTHS[entry.month]}: ${formatNumber(entry.kg, 0)} kg`)
            .join(", ")}
        </p>
      )}
    </figure>
  );
}
