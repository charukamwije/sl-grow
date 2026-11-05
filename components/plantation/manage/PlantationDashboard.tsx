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
  choiceLabel,
  CROP_LABELS,
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
import { btnDanger, btnGhost, btnPrimary, btnSecondary, card, chip, heading, muted, subheading } from "../../ui/styles";
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

  const summary = useMemo(() => summarize(records, year), [records, year]);
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

  // A record in a list, which opens its form in place to be changed
  const item = (kind: ChildKind, record: { id: string }, what: string, content: ReactNode) => (
    <li key={record.id} className="py-3">
      {editing?.kind === kind && editing.id === record.id ? (
        form(kind, record.id, toFormValues(kind, record))
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 text-sm">{content}</div>
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              onClick={() => setEditing({ kind, id: record.id })}
              aria-label={`Edit ${what}`}
            >
              <PencilSquareIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded-full p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-700"
              onClick={() => remove(kind, record.id, what)}
              disabled={pending}
              aria-label={`Delete ${what}`}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </li>
  );

  const addButton = (kind: ChildKind, disabled = false) =>
    editing?.kind === kind && editing.id === null ? (
      form(kind, null)
    ) : (
      <button type="button" className={btnPrimary} onClick={() => setEditing({ kind, id: null })} disabled={disabled}>
        <PlusIcon className="h-4 w-4" aria-hidden="true" />
        {ADD_LABELS[kind]}
      </button>
    );

  const empty = (text: string) => <p className={`${muted} py-3`}>{text}</p>;

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
    { label: "Yield", value: `${formatNumber(summary.harvestKg / plantation.area_ha, 0)} kg/ha` },
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
            {CROP_LABELS[crop]} · {formatNumber(plantation.area_ha, 2)} ha
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
        <HarvestChart months={summary.harvestByMonth} year={year} />
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
            <h2 className={`${subheading} !mb-0`}>Harvests in {year}</h2>
            {addButton("harvest")}
            {harvests.length === 0 ? (
              empty(`No harvests recorded in ${year}.`)
            ) : (
              <ul className="divide-y divide-black/5">
                {harvests.map((row) =>
                  item(
                    "harvest",
                    row,
                    "harvest",
                    <>
                      <p className="font-medium text-gray-900">
                        {formatNumber(row.quantity_kg, 1)} kg {choiceLabel(HARVEST_PRODUCTS[crop], row.product).toLowerCase()}
                        {row.grade && <span className="text-gray-500"> · {row.grade}</span>}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDay(row.harvested_on)}
                        {row.block && ` · ${row.block}`}
                      </p>
                      {row.notes && <p className="mt-1 text-gray-600">{row.notes}</p>}
                    </>
                  )
                )}
              </ul>
            )}
          </>
        )}

        {tab === "money" && (
          <>
            <h2 className={`${subheading} !mb-0`}>Money in {year}</h2>
            <p className="text-sm text-gray-700">
              In <strong className="tabular-nums">{formatLKR(summary.income)}</strong> · Out{" "}
              <strong className="tabular-nums">{formatLKR(summary.expenses)}</strong> · Wages from work days{" "}
              <strong className="tabular-nums">{formatLKR(summary.wages)}</strong>
            </p>
            <p className="text-xs text-gray-500">
              Wages are counted from the Workers tab, so record a worker&apos;s pay there rather than here.
            </p>
            {addButton("transaction")}
            {transactions.length === 0 ? (
              empty(`No money recorded in ${year}.`)
            ) : (
              <ul className="divide-y divide-black/5">
                {transactions.map((row) =>
                  item(
                    "transaction",
                    row,
                    row.kind === "income" ? "income" : "expense",
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">
                          {choiceLabel(row.kind === "income" ? INCOME_CATEGORIES[crop] : EXPENSE_CATEGORIES, row.category)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDay(row.occurred_on)}
                          {row.description && ` · ${row.description}`}
                        </p>
                      </div>
                      <p className={`shrink-0 font-semibold tabular-nums ${row.kind === "income" ? "text-emerald-700" : "text-gray-900"}`}>
                        {row.kind === "income" ? "+" : "−"}
                        {formatLKR(row.amount)}
                      </p>
                    </div>
                  )
                )}
              </ul>
            )}
          </>
        )}

        {tab === "activities" && (
          <>
            <h2 className={`${subheading} !mb-0`}>Field work in {year}</h2>
            {addButton("activity")}
            {activities.length === 0 ? (
              empty(`No field work recorded in ${year}.`)
            ) : (
              <ul className="divide-y divide-black/5">
                {activities.map((row) =>
                  item(
                    "activity",
                    row,
                    "activity",
                    <>
                      <p className="font-medium text-gray-900">{choiceLabel(ACTIVITY_TYPES[crop], row.type)}</p>
                      <p className="text-xs text-gray-500">
                        {formatDay(row.done_on)}
                        {row.block && ` · ${row.block}`}
                      </p>
                      {row.notes && <p className="mt-1 text-gray-600">{row.notes}</p>}
                    </>
                  )
                )}
              </ul>
            )}
          </>
        )}

        {tab === "workers" && (
          <>
            <h2 className={`${subheading} !mb-0`}>Workers</h2>
            {addButton("worker")}
            {records.workers.length === 0 ? (
              empty("No workers added yet. Add the people who work your land to record their days and wages.")
            ) : (
              <ul className="divide-y divide-black/5">
                {records.workers.map((row) =>
                  item(
                    "worker",
                    row,
                    "worker",
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`font-medium ${row.active ? "text-gray-900" : "text-gray-500"}`}>
                          {row.name}
                          {!row.active && <span className="text-xs font-normal"> · no longer working</span>}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatLKR(row.daily_wage)} a day
                          {row.phone && ` · ${row.phone}`}
                        </p>
                      </div>
                      {(owed.get(row.id) ?? 0) > 0 && (
                        <span className="flex items-center gap-2">
                          <span className="text-xs font-medium text-amber-800">
                            Owed {formatLKR(owed.get(row.id)!)}
                          </span>
                          <button
                            type="button"
                            className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50"
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
                      )}
                    </div>
                  )
                )}
              </ul>
            )}

            <div className="space-y-4 border-t border-black/5 pt-4">
              <h3 className="font-semibold text-gray-900">Work days in {year}</h3>
              {addButton("workday", records.workers.length === 0)}
              {workDays.length === 0 ? (
                empty(`No work days recorded in ${year}.`)
              ) : (
                <ul className="divide-y divide-black/5">
                  {workDays.map((row) =>
                    item(
                      "workday",
                      row,
                      "work day",
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">
                            {workerName(row.worker_id)} · {choiceLabel(WORK_TASKS[crop], row.task).toLowerCase()}
                            {row.kg_plucked !== null && <span className="text-gray-500"> · {formatNumber(row.kg_plucked, 1)} kg</span>}
                          </p>
                          <p className="text-xs text-gray-500">{formatDay(row.worked_on)}</p>
                        </div>
                        <p className="shrink-0 text-right">
                          <span className="block font-semibold tabular-nums text-gray-900">{formatLKR(row.wage)}</span>
                          <span className={`text-xs ${row.paid ? "text-emerald-700" : "text-amber-800"}`}>
                            {row.paid ? "Paid" : "Not paid"}
                          </span>
                        </p>
                      </div>
                    )
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
