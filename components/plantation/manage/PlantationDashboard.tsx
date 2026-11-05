"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PencilSquareIcon, PlusIcon, TrashIcon } from "@heroicons/react/20/solid";
import {
  removePlantation,
  removeRecord,
  savePlantation,
  saveRecord,
  settleWorker,
} from "@/app/plantation/manage/actions";
import {
  ACTIVITY_TYPES,
  areaLabel,
  choiceLabel,
  CROP_LABELS,
  EXPECTED_UNIT,
  EXPENSE_CATEGORIES,
  HARVEST_PRODUCTS,
  INCOME_CATEGORIES,
  WORK_TASKS,
} from "@/lib/data/plantation-records";
import {
  FIELDS,
  recordYears,
  summarize,
  wagesOwedByWorker,
  type Plantation,
  type PlantationRecords,
  type RecordKind,
} from "@/lib/plantation/records";
import { formatLKR, formatNumber } from "@/lib/products";
import { btnDanger, btnGhost, btnPrimary, btnSecondary, card, chip, heading, muted } from "../../ui/styles";
import HarvestChart from "./HarvestChart";
import RecordForm, { type FormValues } from "./RecordForm";

type ChildKind = Exclude<RecordKind, "plantation">;
type Tab = "harvests" | "money" | "activities" | "workers";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "harvests", label: "Harvests", icon: "🧺" },
  { id: "money", label: "Money", icon: "💰" },
  { id: "activities", label: "Field work", icon: "🛠️" },
  { id: "workers", label: "Workers", icon: "👷" },
];

const ADD_LABELS: Record<ChildKind, string> = {
  harvest: "Record a harvest",
  transaction: "Record money in or out",
  activity: "Record field work",
  worker: "Add a worker",
  workday: "Record a work day",
};

// The form's text values for a stored record
function toFormValues(kind: RecordKind, record: object): FormValues {
  const source = record as Record<string, unknown>;
  const values: FormValues = {};
  for (const field of FIELDS[kind]) {
    const value = source[field.name];
    values[field.name] = typeof value === "boolean" ? value : value === null || value === undefined ? "" : String(value);
  }
  return values;
}

// ISO dates are stored as typed; shown as "5 Nov 2026" without a timezone shift
function formatDay(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

type Editing = { kind: ChildKind; id: string | null } | null;

/** What a record's row shows */
type Row = {
  /** ISO date, shown as a calendar block; records without one show `icon` */
  date?: string;
  icon?: string;
  title: ReactNode;
  /** Small labelled details, e.g. "Grade C5" */
  tags?: string[];
  notes?: string;
  /** The figure that matters, large on the right */
  value?: ReactNode;
  valueNote?: ReactNode;
};

/** A date as a small calendar page: the day large, month and year above and below */
function DateBlock({ value }: { value: string }) {
  const [year, month, day] = value.split("-").map(Number);
  const monthName = new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(undefined, {
    month: "short",
    timeZone: "UTC",
  });

  return (
    <time
      dateTime={value}
      title={formatDay(value)}
      className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100"
    >
      <span className="text-[10px] font-semibold uppercase leading-none tracking-wide">{monthName}</span>
      <span className="text-xl font-bold leading-tight">{day}</span>
      <span className="text-[10px] leading-none text-emerald-700">{year}</span>
    </time>
  );
}

export default function PlantationDashboard({
  plantation,
  records,
}: {
  plantation: Plantation;
  records: PlantationRecords;
}) {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => recordYears(records, currentYear), [records, currentYear]);
  const [year, setYear] = useState(currentYear);
  const [tab, setTab] = useState<Tab>("harvests");
  const [editing, setEditing] = useState<Editing>(null);
  const [settings, setSettings] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const summary = useMemo(() => summarize(records, year, plantation), [records, year, plantation]);
  const owed = useMemo(() => wagesOwedByWorker(records.workDays), [records.workDays]);
  const workerName = (id: string) => records.workers.find((worker) => worker.id === id)?.name ?? "Removed worker";
  const crop = plantation.crop;
  const ofYear = <T,>(rows: T[], date: (row: T) => string) => rows.filter((row) => date(row).startsWith(`${year}-`));

  const run = (action: () => Promise<{ ok: boolean; error?: string }>, done?: string) => {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setMessage(result.error ?? "Something went wrong.");
      else if (done) setMessage(done);
    });
  };

  const remove = (kind: ChildKind, id: string, what: string) => {
    if (!window.confirm(`Delete this ${what}? This cannot be undone.`)) return;
    run(() => removeRecord(plantation.id, kind, id));
  };

  const form = (kind: ChildKind, id: string | null, initial?: FormValues) => (
    <div className="rounded-3xl bg-emerald-50/50 p-4 ring-1 ring-emerald-100">
      <RecordForm
        key={`${kind}-${id ?? "new"}`}
        kind={kind}
        crop={crop}
        initial={initial}
        workers={records.workers}
        submitLabel={id ? "Save changes" : ADD_LABELS[kind]}
        onSubmit={(values) => saveRecord(plantation.id, kind, id, values)}
        onDone={() => setEditing(null)}
        onCancel={() => setEditing(null)}
      />
    </div>
  );

  // One record as its own row: when on the left, what it is in the middle,
  // the figure that matters on the right, and plainly labelled actions. It
  // opens its form in place to be changed.
  const item = (kind: ChildKind, record: { id: string }, what: string, row: Row) => (
    <li key={record.id}>
      {editing?.kind === kind && editing.id === record.id ? (
        form(kind, record.id, toFormValues(kind, record))
      ) : (
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-3 rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-emerald-200 hover:shadow-sm sm:grid-cols-[auto_1fr_auto_auto]">
          {row.date ? (
            <DateBlock value={row.date} />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl" aria-hidden="true">
              {row.icon}
            </span>
          )}
          <div className="min-w-0 space-y-1.5">
            <p className="text-base font-semibold text-gray-900">{row.title}</p>
            {row.tags && row.tags.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {row.tags.map((tag) => (
                  <li key={tag} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                    {tag}
                  </li>
                ))}
              </ul>
            )}
            {row.notes && <p className="text-sm text-gray-600">{row.notes}</p>}
          </div>
          <div className="text-right">
            {row.value && <p className="text-lg font-bold tabular-nums text-gray-900">{row.value}</p>}
            {row.valueNote}
          </div>
          <div className="col-span-3 flex justify-end gap-2 border-t border-gray-100 pt-3 sm:col-span-1 sm:flex-col sm:border-0 sm:pt-0">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-gray-700 ring-1 ring-gray-200 transition hover:bg-gray-50"
              onClick={() => setEditing({ kind, id: record.id })}
              aria-label={`Edit ${what}`}
            >
              <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
              Edit
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-red-700 ring-1 ring-red-200 transition hover:bg-red-50"
              onClick={() => remove(kind, record.id, what)}
              disabled={pending}
              aria-label={`Delete ${what}`}
            >
              <TrashIcon className="h-4 w-4" aria-hidden="true" />
              Delete
            </button>
          </div>
        </div>
      )}
    </li>
  );

  // A list's heading, what it adds up to, and its Add button on the right;
  // the add form opens full width below
  const listHead = (kind: ChildKind, title: string, totals: string | null, disabled = false) => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {totals && <p className="text-sm text-gray-600">{totals}</p>}
        </div>
        {!(editing?.kind === kind && editing.id === null) && (
          <button type="button" className={btnPrimary} onClick={() => setEditing({ kind, id: null })} disabled={disabled}>
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            {ADD_LABELS[kind]}
          </button>
        )}
      </div>
      {editing?.kind === kind && editing.id === null && form(kind, null)}
    </div>
  );

  const empty = (text: string) => (
    <p className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">{text}</p>
  );
  const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

  const harvests = ofYear(records.harvests, (row) => row.harvested_on);
  const transactions = ofYear(records.transactions, (row) => row.occurred_on);
  const activities = ofYear(records.activities, (row) => row.done_on);
  const workDays = ofYear(records.workDays, (row) => row.worked_on);

  const tiles: { label: string; value: string; note?: string; tone?: "bad" }[] = [
    { label: "Income", value: formatLKR(summary.income) },
    { label: "Expenses", value: formatLKR(summary.expenses) },
    {
      label: "Wages",
      value: formatLKR(summary.wages),
      note: summary.wagesOwed > 0 ? `${formatLKR(summary.wagesOwed)} still owed` : undefined,
    },
    { label: "Profit", value: formatLKR(summary.profit), tone: summary.profit < 0 ? "bad" : undefined },
    { label: "Harvest", value: `${formatNumber(summary.harvestKg, 0)} kg` },
    // Per unit of land the planter thinks in
    {
      label: "Yield",
      value: `${formatNumber(summary.harvestKg / plantation.area, 0)} kg/${plantation.area_unit === "acres" ? "acre" : "ha"}`,
    },
  ];

  return (
    <div className="space-y-5 pb-10">
      <Link href="/plantation/manage" className={btnGhost}>
        ← My plantations
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className={heading}>{plantation.name}</h1>
          <p className={muted}>
            {CROP_LABELS[crop]} · {areaLabel(plantation.area, plantation.area_unit, (n) => formatNumber(n, 2))}
            {plantation.area_unit === "acres" && ` (${formatNumber(plantation.area_ha, 2)} ha)`}
            {plantation.location && ` · ${plantation.location}`}
            {plantation.planted_on && ` · planted ${formatDay(plantation.planted_on)}`}
          </p>
        </div>
        <button type="button" className={btnSecondary} onClick={() => setSettings((open) => !open)}>
          <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
          Plantation details
        </button>
      </header>

      {settings && (
        <section className={`${card} space-y-4`}>
          <RecordForm
            kind="plantation"
            crop={crop}
            initial={toFormValues("plantation", plantation)}
            submitLabel="Save details"
            onSubmit={(values) => savePlantation(plantation.id, values)}
            onDone={() => setSettings(false)}
            onCancel={() => setSettings(false)}
          />
          <div className="border-t border-black/5 pt-4">
            <button
              type="button"
              className={btnDanger}
              disabled={pending}
              onClick={() => {
                if (!window.confirm(`Delete ${plantation.name} and all of its records? This cannot be undone.`)) return;
                startTransition(async () => {
                  const result = await removePlantation(plantation.id);
                  if (result.ok) router.push("/plantation/manage");
                  else setMessage(result.error ?? "Deleting failed.");
                });
              }}
            >
              <TrashIcon className="h-4 w-4" aria-hidden="true" />
              Delete plantation
            </button>
          </div>
        </section>
      )}

      {message && (
        <p role="status" className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
          {message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Year">
        {years.map((option) => (
          <button
            key={option}
            type="button"
            className={chip(option === year)}
            aria-pressed={option === year}
            onClick={() => setYear(option)}
          >
            {option}
          </button>
        ))}
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" aria-label={`Totals for ${year}`}>
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <p className="text-xs font-medium text-gray-500">{tile.label}</p>
            <p className={`mt-1 break-words text-lg font-bold tabular-nums ${tile.tone === "bad" ? "text-red-700" : "text-gray-900"}`}>
              {tile.value}
            </p>
            {tile.note && <p className="mt-0.5 text-xs text-amber-800">{tile.note}</p>}
          </div>
        ))}
      </section>

      <section className={card}>
        <HarvestChart
          months={summary.harvestByMonth}
          year={year}
          unit={EXPECTED_UNIT[crop]}
          plantedKnown={Boolean(plantation.planted_on)}
        />
        {summary.harvestByProduct.length > 1 && (
          <p className="mt-3 text-xs text-gray-600">
            {summary.harvestByProduct
              .map((entry) => `${choiceLabel(HARVEST_PRODUCTS[crop], entry.product)}: ${formatNumber(entry.kg, 0)} kg`)
              .join(" · ")}
          </p>
        )}
      </section>

      <div role="tablist" aria-label="Records" className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={tab === entry.id}
            className={chip(tab === entry.id)}
            onClick={() => {
              setTab(entry.id);
              setEditing(null);
            }}
          >
            <span aria-hidden="true">{entry.icon}</span> {entry.label}
          </button>
        ))}
      </div>

      <section role="tabpanel" className={`${card} space-y-4`}>
        {tab === "harvests" && (
          <>
            {listHead(
              "harvest",
              `Harvests in ${year}`,
              harvests.length > 0
                ? `${count(harvests.length, "harvest", "harvests")} · ${formatNumber(summary.harvestKg, 1)} kg in all`
                : null
            )}
            {harvests.length === 0 ? (
              empty(`No harvests recorded in ${year}.`)
            ) : (
              <ul className="space-y-2">
                {harvests.map((row) =>
                  item("harvest", row, "harvest", {
                    date: row.harvested_on,
                    title: choiceLabel(HARVEST_PRODUCTS[crop], row.product),
                    tags: [row.grade && `Grade ${row.grade}`, row.block && `Block: ${row.block}`].filter(Boolean),
                    notes: row.notes,
                    value: `${formatNumber(row.quantity_kg, 1)} kg`,
                  })
                )}
              </ul>
            )}
          </>
        )}

        {tab === "money" && (
          <>
            {listHead(
              "transaction",
              `Money in ${year}`,
              `In ${formatLKR(summary.income)} · Out ${formatLKR(summary.expenses)} · Wages ${formatLKR(summary.wages)}`
            )}
            <p className="text-xs text-gray-500">
              Wages are counted from the Workers tab, so record a worker&apos;s pay there rather than here.
            </p>
            {transactions.length === 0 ? (
              empty(`No money recorded in ${year}.`)
            ) : (
              <ul className="space-y-2">
                {transactions.map((row) =>
                  item("transaction", row, row.kind === "income" ? "income" : "expense", {
                    date: row.occurred_on,
                    title: choiceLabel(row.kind === "income" ? INCOME_CATEGORIES[crop] : EXPENSE_CATEGORIES, row.category),
                    tags: [row.kind === "income" ? "Money in" : "Money out"],
                    notes: row.description,
                    value: (
                      <span className={row.kind === "income" ? "text-emerald-700" : "text-gray-900"}>
                        {row.kind === "income" ? "+ " : "− "}
                        {formatLKR(row.amount)}
                      </span>
                    ),
                  })
                )}
              </ul>
            )}
          </>
        )}

        {tab === "activities" && (
          <>
            {listHead(
              "activity",
              `Field work in ${year}`,
              activities.length > 0 ? count(activities.length, "job recorded", "jobs recorded") : null
            )}
            {activities.length === 0 ? (
              empty(`No field work recorded in ${year}.`)
            ) : (
              <ul className="space-y-2">
                {activities.map((row) =>
                  item("activity", row, "activity", {
                    date: row.done_on,
                    title: choiceLabel(ACTIVITY_TYPES[crop], row.type),
                    tags: row.block ? [`Block: ${row.block}`] : [],
                    notes: row.notes,
                  })
                )}
              </ul>
            )}
          </>
        )}

        {tab === "workers" && (
          <>
            {listHead(
              "worker",
              "Workers",
              records.workers.length > 0
                ? `${count(records.workers.filter((worker) => worker.active).length, "working now", "working now")}${
                    summary.wagesOwed > 0 ? ` · ${formatLKR(summary.wagesOwed)} owed in ${year}` : ""
                  }`
                : null
            )}
            {records.workers.length === 0 ? (
              empty("No workers added yet. Add the people who work your land to record their days and wages.")
            ) : (
              <ul className="space-y-2">
                {records.workers.map((row) => {
                  const due = owed.get(row.id) ?? 0;
                  return item("worker", row, "worker", {
                    icon: "👷",
                    title: <span className={row.active ? "" : "text-gray-500"}>{row.name}</span>,
                    tags: [`${formatLKR(row.daily_wage)} a day`, row.phone, !row.active && "No longer working"].filter(
                      (tag): tag is string => Boolean(tag)
                    ),
                    value: due > 0 ? <span className="text-amber-800">{formatLKR(due)}</span> : undefined,
                    valueNote:
                      due > 0 ? (
                        <span className="flex flex-col items-end gap-1.5">
                          <span className="text-xs text-amber-800">owed</span>
                          <button
                            type="button"
                            className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-700"
                            disabled={pending}
                            onClick={() => {
                              if (window.confirm(`Mark all of ${row.name}'s unpaid days as paid?`)) {
                                run(() => settleWorker(plantation.id, row.id), `${row.name} marked paid.`);
                              }
                            }}
                          >
                            Mark paid
                          </button>
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-700">All paid</span>
                      ),
                  });
                })}
              </ul>
            )}

            <div className="space-y-4 border-t border-black/5 pt-5">
              {listHead(
                "workday",
                `Work days in ${year}`,
                workDays.length > 0
                  ? `${count(workDays.length, "day", "days")} · ${formatLKR(summary.wages)} in wages`
                  : null,
                records.workers.length === 0
              )}
              {workDays.length === 0 ? (
                empty(
                  records.workers.length === 0
                    ? "Add a worker first, then record their work days here."
                    : `No work days recorded in ${year}.`
                )
              ) : (
                <ul className="space-y-2">
                  {workDays.map((row) =>
                    item("workday", row, "work day", {
                      date: row.worked_on,
                      title: workerName(row.worker_id),
                      tags: [
                        choiceLabel(WORK_TASKS[crop], row.task),
                        row.kg_plucked !== null ? `${formatNumber(row.kg_plucked, 1)} kg` : "",
                      ].filter(Boolean),
                      value: formatLKR(row.wage),
                      valueNote: (
                        <span
                          className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            row.paid ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
                          }`}
                        >
                          {row.paid ? "Paid" : "Not paid"}
                        </span>
                      ),
                    })
                  )}
                </ul>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
