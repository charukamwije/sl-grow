"use client";

import { useState } from "react";

export type BarRow = {
  key: string;
  label: string;
  icon?: string;
  value: number;
  /** The value as shown, e.g. "LKR 1,440" or "30 days" */
  display: string;
};

type BarChartProps = {
  title: string;
  subtitle?: string;
  rows: BarRow[];
  /** Column headings for the table view */
  labelHeading: string;
  valueHeading: string;
  tableToggle: string;
};

/**
 * A ranked, single-series horizontal bar chart. One hue, so no legend: the
 * title names the series. Bars start at a shared baseline with a rounded
 * data end; values sit at the end of each bar in text ink, never the bar
 * colour. Hovering or focusing a row dims the others and shows its value in
 * a tooltip. The same numbers are available as a table for screen readers
 * and anyone who prefers one.
 */
export default function BarChart({
  title,
  subtitle,
  rows,
  labelHeading,
  valueHeading,
  tableToggle,
}: BarChartProps) {
  const [active, setActive] = useState<string | null>(null);
  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <figure className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
      <figcaption className="mb-4">
        <p className="font-semibold text-gray-900">{title}</p>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </figcaption>

      <ul className="space-y-1" aria-hidden="true">
        {rows.map((row, i) => {
          const dimmed = active !== null && active !== row.key;
          return (
            <li
              key={row.key}
              className={`group relative grid grid-cols-[6.5rem_1fr] items-center gap-3 rounded-lg py-1 transition-opacity sm:grid-cols-[8rem_1fr] ${
                dimmed ? "opacity-40" : ""
              }`}
              onMouseEnter={() => setActive(row.key)}
              onMouseLeave={() => setActive(null)}
            >
              <span className="flex min-w-0 items-center gap-1.5 text-xs text-gray-700 sm:text-sm">
                {row.icon && <span>{row.icon}</span>}
                <span className="truncate">{row.label}</span>
              </span>
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="grow-bar h-2.5 rounded-r-[4px] bg-emerald-600"
                  style={{
                    width: `${Math.max((row.value / max) * 100, 2)}%`,
                    transitionDelay: `${i * 50}ms`,
                  }}
                />
                <span className="shrink-0 text-xs font-medium tabular-nums text-gray-700">
                  {row.display}
                </span>
              </span>
              {active === row.key && (
                <span className="pointer-events-none absolute -top-8 left-24 z-10 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1 text-xs text-white shadow-lg sm:left-32">
                  {row.label}: {row.display}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-xs font-medium text-emerald-700">
          {tableToggle}
        </summary>
        <div className="table-scroll mt-2">
          <table>
            <caption className="sr-only">{title}</caption>
            <thead>
              <tr>
                <th scope="col">{labelHeading}</th>
                <th scope="col" className="num">
                  {valueHeading}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <td>{row.label}</td>
                  <td className="num">{row.display}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
