/**
 * The plantation manager's records: what each one holds, how a form's input
 * is checked, and the totals a planter sees. One field list per record kind
 * drives both the server-side checks and the form, so the two cannot drift.
 *
 * Field names are the database columns (supabase/migrations/0009), so a
 * checked record is stored as it is and a stored row fills the form again.
 */
import {
  ACTIVITY_TYPES,
  EXPENSE_CATEGORIES,
  HARVEST_PRODUCTS,
  INCOME_CATEGORIES,
  PLANTATION_CROPS,
  WORK_TASKS,
  CROP_LABELS,
  type Choice,
  type PlantationCrop,
} from "../data/plantation-records";

export const RECORD_KINDS = ["plantation", "harvest", "transaction", "activity", "worker", "workday"] as const;

export type RecordKind = (typeof RECORD_KINDS)[number];

export function isRecordKind(value: unknown): value is RecordKind {
  return typeof value === "string" && (RECORD_KINDS as readonly string[]).includes(value);
}

export type Plantation = {
  id: string;
  name: string;
  crop: PlantationCrop;
  area_ha: number;
  location: string;
  planted_on: string | null;
  notes: string;
  created_at: string;
};

export type Harvest = {
  id: string;
  harvested_on: string;
  product: string;
  quantity_kg: number;
  block: string;
  grade: string;
  notes: string;
};

export type Transaction = {
  id: string;
  occurred_on: string;
  kind: "income" | "expense";
  category: string;
  amount: number;
  description: string;
};

export type Activity = {
  id: string;
  done_on: string;
  type: string;
  block: string;
  notes: string;
};

export type Worker = {
  id: string;
  name: string;
  phone: string;
  daily_wage: number;
  active: boolean;
};

export type WorkDay = {
  id: string;
  worker_id: string;
  worked_on: string;
  task: string;
  kg_plucked: number | null;
  wage: number;
  paid: boolean;
};

export type PlantationRecords = {
  harvests: Harvest[];
  transactions: Transaction[];
  activities: Activity[];
  workers: Worker[];
  workDays: WorkDay[];
};

/** What a form field is, for checking it and for drawing it */
export type Field = {
  name: string;
  label: string;
  type: "text" | "textarea" | "date" | "number" | "choice" | "checkbox" | "worker";
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  maxLength?: number;
  hint?: string;
  /** The options, which can hang on the crop and on other fields' values */
  choices?: (crop: PlantationCrop, values: Record<string, unknown>) => Choice[];
  /** Hidden unless this says so, given the other fields' values */
  shown?: (crop: PlantationCrop, values: Record<string, unknown>) => boolean;
};

const TEXT = 200;
const LONG_TEXT = 1000;
const MAX_KG = 10_000_000;
const MAX_LKR = 1_000_000_000;

const date = (name: string, label: string): Field => ({ name, label, type: "date", required: true });
const block: Field = { name: "block", label: "Field or block", type: "text", maxLength: TEXT, hint: "e.g. Upper block" };
const notes = (name = "notes"): Field => ({ name, label: "Notes", type: "textarea", maxLength: LONG_TEXT });

export const FIELDS: Record<RecordKind, Field[]> = {
  plantation: [
    { name: "name", label: "Plantation name", type: "text", required: true, maxLength: 120 },
    {
      name: "crop",
      label: "Crop",
      type: "choice",
      required: true,
      choices: () => PLANTATION_CROPS.map((crop) => ({ value: crop, label: CROP_LABELS[crop] })),
    },
    { name: "area_ha", label: "Area (hectares)", type: "number", required: true, min: 0.01, max: 100_000, step: 0.01, hint: "1 acre is about 0.405 ha" },
    { name: "location", label: "Location", type: "text", maxLength: TEXT, hint: "Village or district" },
    { name: "planted_on", label: "Planted on", type: "date" },
    notes(),
  ],
  harvest: [
    date("harvested_on", "Date"),
    { name: "product", label: "Product", type: "choice", required: true, choices: (crop) => HARVEST_PRODUCTS[crop] },
    { name: "quantity_kg", label: "Quantity (kg)", type: "number", required: true, min: 0.01, max: MAX_KG, step: 0.01 },
    block,
    { name: "grade", label: "Grade", type: "text", maxLength: 60, hint: "e.g. C5 or Alba" },
    notes(),
  ],
  transaction: [
    date("occurred_on", "Date"),
    {
      name: "kind",
      label: "Money",
      type: "choice",
      required: true,
      choices: () => [
        { value: "expense", label: "Money out (expense)" },
        { value: "income", label: "Money in (income)" },
      ],
    },
    {
      name: "category",
      label: "Category",
      type: "choice",
      required: true,
      choices: (crop, values) => (values.kind === "income" ? INCOME_CATEGORIES[crop] : EXPENSE_CATEGORIES),
    },
    { name: "amount", label: "Amount (LKR)", type: "number", required: true, min: 0.01, max: MAX_LKR, step: 0.01 },
    { name: "description", label: "Description", type: "text", maxLength: TEXT },
  ],
  activity: [
    date("done_on", "Date"),
    { name: "type", label: "Activity", type: "choice", required: true, choices: (crop) => ACTIVITY_TYPES[crop] },
    block,
    notes(),
  ],
  worker: [
    { name: "name", label: "Name", type: "text", required: true, maxLength: 120 },
    { name: "phone", label: "Phone", type: "text", maxLength: 30 },
    { name: "daily_wage", label: "Daily wage (LKR)", type: "number", required: true, min: 0, max: MAX_LKR, step: 1 },
    { name: "active", label: "Still working here", type: "checkbox" },
  ],
  workday: [
    { name: "worker_id", label: "Worker", type: "worker", required: true },
    date("worked_on", "Date"),
    { name: "task", label: "Task", type: "choice", required: true, choices: (crop) => WORK_TASKS[crop] },
    {
      name: "kg_plucked",
      label: "Kg plucked or cut",
      type: "number",
      min: 0,
      max: MAX_KG,
      step: 0.1,
      shown: (_crop, values) => values.task === "plucking" || values.task === "harvesting" || values.task === "peeling",
    },
    { name: "wage", label: "Wage (LKR)", type: "number", required: true, min: 0, max: MAX_LKR, step: 1 },
    { name: "paid", label: "Paid", type: "checkbox" },
  ],
};

export type RecordValues = Record<string, string | number | boolean | null>;

export type CheckResult =
  | { ok: true; values: RecordValues }
  | { ok: false; errors: Record<string, string> };

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function isRealDate(value: string): boolean {
  if (!DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

/**
 * Checks a record's input (form text, or JSON) against its field list. A
 * checkbox counts as ticked when sent as "on" or true. Hidden fields are
 * stored empty. `crop` is the plantation's, or the one chosen for a new
 * plantation; worker ids are checked against the plantation by the caller.
 */
export function checkRecord(
  kind: RecordKind,
  raw: Record<string, unknown>,
  crop: PlantationCrop | null
): CheckResult {
  const values: RecordValues = {};
  const errors: Record<string, string> = {};
  const cropFor = (): PlantationCrop =>
    crop ?? ((PLANTATION_CROPS as readonly unknown[]).includes(raw.crop) ? (raw.crop as PlantationCrop) : "tea");

  for (const field of FIELDS[kind]) {
    const input = raw[field.name];
    const text = typeof input === "string" ? input.trim() : typeof input === "number" ? String(input) : "";

    if (field.shown && !field.shown(cropFor(), raw)) {
      values[field.name] = field.type === "number" ? null : "";
      continue;
    }

    if (field.type === "checkbox") {
      values[field.name] = input === true || input === "on" || input === "true";
      continue;
    }

    if (!text) {
      if (field.required) errors[field.name] = `Enter the ${field.label.toLowerCase()}.`;
      else values[field.name] = field.type === "number" || field.type === "date" ? null : "";
      continue;
    }

    switch (field.type) {
      case "number": {
        const number = Number(text.replace(/,/g, ""));
        if (!Number.isFinite(number)) errors[field.name] = `${field.label} must be a number.`;
        else if (field.min !== undefined && number < field.min)
          errors[field.name] = `${field.label} must be at least ${field.min}.`;
        else if (field.max !== undefined && number > field.max)
          errors[field.name] = `${field.label} is too large.`;
        else values[field.name] = number;
        break;
      }
      case "date":
        if (!isRealDate(text)) errors[field.name] = "Choose a date.";
        else values[field.name] = text;
        break;
      case "choice": {
        const options = field.choices!(cropFor(), raw);
        if (!options.some((option) => option.value === text)) errors[field.name] = `Choose a ${field.label.toLowerCase()}.`;
        else values[field.name] = text;
        break;
      }
      default:
        if (field.maxLength !== undefined && text.length > field.maxLength)
          errors[field.name] = `${field.label} is too long.`;
        else values[field.name] = text;
    }
  }

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, values };
}

export type MonthTotal = { month: number; kg: number };

export type PlantationSummary = {
  income: number;
  expenses: number;
  /** Wages from work days, paid or still owed */
  wages: number;
  wagesOwed: number;
  profit: number;
  harvestKg: number;
  /** January first, 12 entries */
  harvestByMonth: MonthTotal[];
  harvestByProduct: { product: string; kg: number }[];
};

const inYear = (value: string, year: number) => value.startsWith(`${year}-`);

/** One year's totals for a plantation */
export function summarize(
  records: Pick<PlantationRecords, "harvests" | "transactions" | "workDays">,
  year: number
): PlantationSummary {
  let income = 0;
  let expenses = 0;
  for (const entry of records.transactions) {
    if (!inYear(entry.occurred_on, year)) continue;
    if (entry.kind === "income") income += entry.amount;
    else expenses += entry.amount;
  }

  let wages = 0;
  let wagesOwed = 0;
  for (const day of records.workDays) {
    if (!inYear(day.worked_on, year)) continue;
    wages += day.wage;
    if (!day.paid) wagesOwed += day.wage;
  }

  const byMonth = Array.from({ length: 12 }, (_, month) => ({ month, kg: 0 }));
  const byProduct = new Map<string, number>();
  let harvestKg = 0;
  for (const harvest of records.harvests) {
    if (!inYear(harvest.harvested_on, year)) continue;
    harvestKg += harvest.quantity_kg;
    byMonth[Number(harvest.harvested_on.slice(5, 7)) - 1].kg += harvest.quantity_kg;
    byProduct.set(harvest.product, (byProduct.get(harvest.product) ?? 0) + harvest.quantity_kg);
  }

  return {
    income,
    expenses,
    wages,
    wagesOwed,
    profit: income - expenses - wages,
    harvestKg,
    harvestByMonth: byMonth,
    harvestByProduct: [...byProduct].map(([product, kg]) => ({ product, kg })).sort((a, b) => b.kg - a.kg),
  };
}

/** The years with any record, newest first, always including `current` */
export function recordYears(records: PlantationRecords, current: number): number[] {
  const years = new Set<number>([current]);
  const add = (value: string) => years.add(Number(value.slice(0, 4)));
  records.harvests.forEach((entry) => add(entry.harvested_on));
  records.transactions.forEach((entry) => add(entry.occurred_on));
  records.activities.forEach((entry) => add(entry.done_on));
  records.workDays.forEach((entry) => add(entry.worked_on));
  return [...years].sort((a, b) => b - a);
}

/** Wages still owed to each worker, over all years */
export function wagesOwedByWorker(workDays: WorkDay[]): Map<string, number> {
  const owed = new Map<string, number>();
  for (const day of workDays) {
    if (!day.paid) owed.set(day.worker_id, (owed.get(day.worker_id) ?? 0) + day.wage);
  }
  return owed;
}
