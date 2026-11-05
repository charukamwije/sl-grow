"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { formatLKR } from "@/lib/products";

export type DayTotals = { workers: number; wages: number; unpaid: boolean };

type WorkCalendarProps = {
  year: number;
  /** 0 = January */
  month: number;
  onMonth: (month: number) => void;
  /** Keyed by ISO date */
  days: Map<string, DayTotals>;
  selected: string | null;
  onSelect: (date: string) => void;
  /** Today as an ISO date, in the planter's timezone */
  today: string;
};

// Sri Lankan wall calendars start the week on Sunday
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const pad = (n: number) => String(n).padStart(2, "0");

export const isoDate = (year: number, month: number, day: number) => `${year}-${pad(month + 1)}-${pad(day)}`;

/**
 * One month of work days as a calendar. A day with work shows how many
 * workers came and what their wages came to, with a dot while any of it is
 * unpaid. Choosing a day opens it below the calendar.
 */
export default function WorkCalendar({ year, month, onMonth, days, selected, onSelect, today }: WorkCalendarProps) {
  const first = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const blanks = first.getUTCDay();
  const monthName = first.toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onMonth(month - 1)}
          disabled={month === 0}
          className="rounded-full p-2 text-gray-600 ring-1 ring-gray-200 transition hover:bg-gray-50 disabled:opacity-30"
          aria-label="Previous month"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <h3 className="text-base font-semibold text-gray-900" aria-live="polite">
          {monthName}
        </h3>
        <button
          type="button"
          onClick={() => onMonth(month + 1)}
          disabled={month === 11}
          className="rounded-full p-2 text-gray-600 ring-1 ring-gray-200 transition hover:bg-gray-50 disabled:opacity-30"
          aria-label="Next month"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500" aria-hidden="true">
        {WEEKDAYS.map((day) => (
          <span key={day}>
            {day.slice(0, 1)}
            <span className="hidden sm:inline">{day.slice(1)}</span>
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: blanks }, (_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const date = isoDate(year, month, day);
          const totals = days.get(date);
          const isSelected = selected === date;
          const isToday = today === date;
          const label = new Date(Date.UTC(year, month, day)).toLocaleDateString(undefined, {
            weekday: "long",
            day: "numeric",
            month: "long",
            timeZone: "UTC",
          });

          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelect(date)}
              aria-pressed={isSelected}
              aria-label={
                totals
                  ? `${label}: ${totals.workers} worker${totals.workers === 1 ? "" : "s"}, ${formatLKR(totals.wages)}${totals.unpaid ? ", not all paid" : ""}`
                  : `${label}: no work recorded`
              }
              className={`relative flex min-h-14 flex-col items-center justify-start gap-0.5 rounded-xl p-1 text-sm transition sm:min-h-20 sm:p-1.5 ${
                isSelected
                  ? "bg-emerald-600 text-white shadow-sm"
                  : totals
                    ? "bg-emerald-50 text-emerald-950 ring-1 ring-emerald-200 hover:bg-emerald-100"
                    : "text-gray-700 hover:bg-gray-50"
              } ${isToday && !isSelected ? "ring-2 ring-emerald-500" : ""}`}
            >
              <span className={`font-semibold ${isToday ? "underline decoration-2 underline-offset-2" : ""}`}>{day}</span>
              {totals && (
                <>
                  <span
                    className={`rounded-full px-1.5 text-[10px] font-semibold leading-4 sm:text-xs ${
                      isSelected ? "bg-white/20" : "bg-emerald-600 text-white"
                    }`}
                  >
                    👷{totals.workers}
                  </span>
                  <span className={`hidden text-[10px] tabular-nums sm:block ${isSelected ? "text-emerald-50" : "text-gray-600"}`}>
                    {formatLKR(totals.wages)}
                  </span>
                  {totals.unpaid && (
                    <span
                      className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white"
                      aria-hidden="true"
                    />
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-emerald-50 ring-1 ring-emerald-200" aria-hidden="true" />
          Work recorded
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
          Not all paid
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded ring-2 ring-emerald-500" aria-hidden="true" />
          Today
        </span>
      </p>
    </div>
  );
}
