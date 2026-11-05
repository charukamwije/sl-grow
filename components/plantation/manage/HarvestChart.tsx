"use client";

import { useState } from "react";
import type { MonthTotal } from "@/lib/plantation/records";
import { formatNumber } from "@/lib/products";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const HEIGHT = 160;
// Room above the tallest mark for its tooltip
const HEADROOM = 24;
// Checked with the dataviz palette validator against the white card
const HARVESTED = "#059669";
const EXPECTED = "#c2410c";

type HarvestChartProps = {
  months: MonthTotal[];
  year: number;
  /** What both series are measured in, e.g. "green leaf" */
  unit: string;
  /** Without a planting date, the expected harvest assumes full bearing */
  plantedKnown: boolean;
};

const kg = (value: number) => `${formatNumber(value, 0)} kg`;

/**
 * Kg harvested in each month against what the land should give. Harvested
 * is a column on a shared baseline; expected is a line across the month in a
 * second hue, so the two differ by shape as well as colour. Hovering or
 * focusing a month shows both values; a table holds the same numbers.
 */
export default function HarvestChart({ months, year, unit, plantedKnown }: HarvestChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const hasExpected = months.some((entry) => (entry.expectedKg ?? 0) > 0);
  const max = Math.max(...months.map((entry) => Math.max(entry.comparableKg, entry.expectedKg ?? 0)));
  const scale = (value: number) => (max > 0 ? (value / max) * (HEIGHT - HEADROOM) : 0);
  const harvested = months.reduce((sum, entry) => sum + entry.comparableKg, 0);
  const expected = months.reduce((sum, entry) => sum + (entry.expectedKg ?? 0), 0);

  return (
    <figure className="space-y-3">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-gray-900">
          Harvest by month, {year} (kg {unit})
        </span>
        <button
          type="button"
          onClick={() => setAsTable((value) => !value)}
          className="text-xs font-medium text-emerald-700 hover:underline"
        >
          {asTable ? "Show chart" : "Show as table"}
        </button>
      </figcaption>

      {hasExpected && (
        <ul className="flex flex-wrap gap-4 text-xs text-gray-700" aria-label="Legend">
          <li className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm" style={{ background: HARVESTED }} aria-hidden="true" />
            Harvested
          </li>
          <li className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full" style={{ background: EXPECTED }} aria-hidden="true" />
            Expected
          </li>
        </ul>
      )}

      {max === 0 ? (
        <p className="rounded-2xl bg-gray-50 p-4 text-center text-sm text-gray-500">
          No harvest recorded or expected in {year}.
        </p>
      ) : asTable ? (
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-gray-500">
            <tr>
              <th className="py-1 font-medium">Month</th>
              <th className="py-1 text-right font-medium">Harvested (kg)</th>
              <th className="py-1 text-right font-medium">Expected (kg)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {months.map((entry) => (
              <tr key={entry.month}>
                <td className="py-1.5 text-gray-700">{MONTHS[entry.month]}</td>
                <td className="py-1.5 text-right tabular-nums text-gray-900">{formatNumber(entry.comparableKg, 1)}</td>
                <td className="py-1.5 text-right tabular-nums text-gray-600">
                  {entry.expectedKg === null ? "—" : formatNumber(entry.expectedKg, 1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div aria-hidden="true">
          <div className="relative flex items-end gap-[2px] border-b border-gray-200" style={{ height: HEIGHT }}>
            {months.map((entry) => {
              const bar = entry.comparableKg > 0 ? Math.max(4, scale(entry.comparableKg)) : 0;
              const target = entry.expectedKg ? scale(entry.expectedKg) : 0;
              const dim = active !== null && active !== entry.month;
              return (
                <div
                  key={entry.month}
                  className="relative flex h-full flex-1 items-end justify-center"
                  onMouseEnter={() => setActive(entry.month)}
                  onMouseLeave={() => setActive(null)}
                >
                  {active === entry.month && (
                    <span
                      className="absolute z-10 whitespace-nowrap rounded-lg bg-gray-900 px-2 py-1 text-xs font-medium text-white shadow"
                      style={{ bottom: Math.max(bar, target) + 6 }}
                    >
                      {MONTHS[entry.month]} · {kg(entry.comparableKg)} harvested
                      {entry.expectedKg !== null && ` · ${kg(entry.expectedKg)} expected`}
                    </span>
                  )}
                  <div
                    className={`w-full max-w-8 rounded-t transition-opacity ${dim ? "opacity-40" : ""}`}
                    style={{ height: bar, background: HARVESTED }}
                  />
                  {target > 0 && (
                    <div
                      className={`absolute left-0 right-0 mx-auto h-0.5 w-full max-w-10 rounded-full ring-2 ring-white transition-opacity ${dim ? "opacity-40" : ""}`}
                      style={{ bottom: target - 1, background: EXPECTED }}
                    />
                  )}
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

      {hasExpected && (
        <p className="text-sm text-gray-700">
          Harvested <strong className="tabular-nums">{kg(harvested)}</strong> of about{" "}
          <strong className="tabular-nums">{kg(expected)}</strong> expected in {year}
          {expected > 0 && ` (${Math.round((harvested / expected) * 100)}%)`}.
        </p>
      )}
      <p className="text-xs leading-relaxed text-gray-500">
        Expected is a rough guide from placeholder yields for your area and the plantation&apos;s
        age, spread by the usual Sri Lankan season
        {plantedKnown ? "" : " (no planting date given, so full bearing is assumed)"}. Check it
        with the Tea Research Institute or the Department of Export Agriculture.
      </p>

      {max > 0 && !asTable && (
        <p className="sr-only">
          {months
            .map(
              (entry) =>
                `${MONTHS[entry.month]}: ${kg(entry.comparableKg)} harvested` +
                (entry.expectedKg !== null ? `, ${kg(entry.expectedKg)} expected` : "")
            )
            .join("; ")}
        </p>
      )}
    </figure>
  );
}
