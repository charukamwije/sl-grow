// Fails the build if this module is ever pulled into a client bundle
import "server-only";
import type {
  Activity,
  Harvest,
  Plantation,
  PlantationRecords,
  RecordKind,
  RecordValues,
  Transaction,
  Worker,
  WorkDay,
} from "./plantation/records";
import { adminDb } from "./supabase/admin";
import { DatabaseError, isUuid } from "./supabase/store";

/**
 * A planter's plantations and their records (supabase/migrations/0009).
 * Every query is scoped to the uid it is handed, so privacy rests on callers
 * passing the uid from the verified session, never one from the request.
 */

type Result<T> = { data: T | null; error: { message: string; code?: string } | null; status: number };

function unwrap<T>({ data, error, status }: Result<T>): T {
  if (error) throw new DatabaseError(error.message, error.code ?? "", status);
  return data as T;
}

// Postgres numeric comes back as a string
const num = (value: unknown) => Number(value);
const numOrNull = (value: unknown) => (value === null || value === undefined ? null : Number(value));

/** The table and date column behind each kind of record */
export const TABLES: Record<Exclude<RecordKind, "plantation">, { table: string; date?: string }> = {
  harvest: { table: "plantation_harvests", date: "harvested_on" },
  transaction: { table: "plantation_transactions", date: "occurred_on" },
  activity: { table: "plantation_activities", date: "done_on" },
  worker: { table: "plantation_workers" },
  workday: { table: "plantation_work_days", date: "worked_on" },
};

const PLANTATION_COLUMNS =
  "id, name, crop, area, area_unit, area_ha, location, planted_on, notes, created_at";

function toPlantation(row: Plantation): Plantation {
  return {
    ...row,
    area: num(row.area),
    area_ha: num(row.area_ha),
    created_at: new Date(row.created_at).toISOString(),
  };
}

export async function listPlantations(uid: string): Promise<Plantation[]> {
  const rows = unwrap<Plantation[]>(
    await adminDb
      .from("plantations")
      .select(PLANTATION_COLUMNS)
      .eq("user_id", uid)
      .order("created_at", { ascending: true })
      .overrideTypes<Plantation[], { merge: false }>()
  );
  return rows.map(toPlantation);
}

/** One of the planter's own plantations, or null (someone else's too) */
export async function getPlantation(uid: string, id: string): Promise<Plantation | null> {
  if (!isUuid(id)) return null;

  const row = unwrap<Plantation | null>(
    await adminDb
      .from("plantations")
      .select(PLANTATION_COLUMNS)
      .eq("id", id)
      .eq("user_id", uid)
      .maybeSingle<Plantation>()
  );
  return row && toPlantation(row);
}

export async function insertPlantation(uid: string, values: RecordValues): Promise<string> {
  const row = unwrap(
    await adminDb.from("plantations").insert({ ...values, user_id: uid }).select("id").single<{ id: string }>()
  );
  return row.id;
}

export async function updatePlantation(uid: string, id: string, values: RecordValues): Promise<boolean> {
  if (!isUuid(id)) return false;
  // The crop decides what every record means, so it is set once
  const rest = { ...values };
  delete rest.crop;
  const rows = unwrap<{ id: string }[]>(
    await adminDb
      .from("plantations")
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", uid)
      .select("id")
  );
  return rows.length > 0;
}

/** Deletes the plantation and, by cascade, every record of it */
export async function deletePlantation(uid: string, id: string): Promise<boolean> {
  if (!isUuid(id)) return false;
  const rows = unwrap<{ id: string }[]>(
    await adminDb.from("plantations").delete().eq("id", id).eq("user_id", uid).select("id")
  );
  return rows.length > 0;
}

// Enough for years of daily records; older ones stay stored
const RECORD_LIMIT = 5000;

async function list<T>(uid: string, plantationId: string, kind: keyof typeof TABLES, columns: string): Promise<T[]> {
  const { table, date } = TABLES[kind];
  const query = adminDb
    .from(table)
    .select(columns)
    .eq("plantation_id", plantationId)
    .eq("user_id", uid);
  const ordered = date
    ? query.order(date, { ascending: false }).order("created_at", { ascending: false })
    : query.order("name", { ascending: true });
  return unwrap<T[]>(await ordered.limit(RECORD_LIMIT).overrideTypes<T[], { merge: false }>());
}

/** Every record of one of the planter's plantations, newest first */
export async function loadRecords(uid: string, plantationId: string): Promise<PlantationRecords> {
  const [harvests, transactions, activities, workers, workDays] = await Promise.all([
    list<Harvest>(uid, plantationId, "harvest", "id, harvested_on, product, quantity_kg, block, grade, notes"),
    list<Transaction>(uid, plantationId, "transaction", "id, occurred_on, kind, category, amount, description"),
    list<Activity>(uid, plantationId, "activity", "id, done_on, type, block, notes"),
    list<Worker>(uid, plantationId, "worker", "id, name, phone, daily_wage, active"),
    list<WorkDay>(uid, plantationId, "workday", "id, worker_id, worked_on, task, kg_plucked, wage, paid"),
  ]);

  return {
    harvests: harvests.map((row) => ({ ...row, quantity_kg: num(row.quantity_kg) })),
    transactions: transactions.map((row) => ({ ...row, amount: num(row.amount) })),
    activities,
    workers: workers.map((row) => ({ ...row, daily_wage: num(row.daily_wage) })),
    workDays: workDays.map((row) => ({ ...row, wage: num(row.wage), kg_plucked: numOrNull(row.kg_plucked) })),
  };
}

/** For the plantation list: one year's money and harvest records of all plantations */
export async function loadYearTotals(
  uid: string,
  year: number
): Promise<Pick<PlantationRecords, "harvests" | "transactions" | "workDays"> & {
  plantationOf: Map<string, string>;
}> {
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;
  const plantationOf = new Map<string, string>();

  const yearRows = async <T extends { id: string }>(kind: "harvest" | "transaction" | "workday", columns: string) => {
    const { table, date } = TABLES[kind];
    const rows = unwrap<(T & { plantation_id: string })[]>(
      await adminDb
        .from(table)
        .select(`plantation_id, ${columns}`)
        .eq("user_id", uid)
        .gte(date!, from)
        .lte(date!, to)
        .limit(RECORD_LIMIT * 4)
        .overrideTypes<(T & { plantation_id: string })[], { merge: false }>()
    );
    for (const row of rows) plantationOf.set(row.id, row.plantation_id);
    return rows;
  };

  const [harvests, transactions, workDays] = await Promise.all([
    yearRows<Harvest>("harvest", "id, harvested_on, product, quantity_kg"),
    yearRows<Transaction>("transaction", "id, occurred_on, kind, amount"),
    yearRows<WorkDay>("workday", "id, worked_on, wage, paid"),
  ]);

  return {
    harvests: harvests.map((row) => ({ ...row, quantity_kg: num(row.quantity_kg) })),
    transactions: transactions.map((row) => ({ ...row, amount: num(row.amount) })),
    workDays: workDays.map((row) => ({ ...row, wage: num(row.wage) })),
    plantationOf,
  };
}

/** Whether the worker belongs to this plantation (a work day must name one that does) */
export async function isPlantationWorker(uid: string, plantationId: string, workerId: string): Promise<boolean> {
  if (!isUuid(workerId)) return false;
  const row = unwrap(
    await adminDb
      .from("plantation_workers")
      .select("id")
      .eq("id", workerId)
      .eq("plantation_id", plantationId)
      .eq("user_id", uid)
      .maybeSingle<{ id: string }>()
  );
  return row !== null;
}

export async function insertRecord(
  uid: string,
  plantationId: string,
  kind: keyof typeof TABLES,
  values: RecordValues
): Promise<string> {
  const row = unwrap(
    await adminDb
      .from(TABLES[kind].table)
      .insert({ ...values, plantation_id: plantationId, user_id: uid })
      .select("id")
      .single<{ id: string }>()
  );
  return row.id;
}

export async function updateRecord(
  uid: string,
  plantationId: string,
  kind: keyof typeof TABLES,
  id: string,
  values: RecordValues
): Promise<boolean> {
  if (!isUuid(id)) return false;
  const rows = unwrap<{ id: string }[]>(
    await adminDb
      .from(TABLES[kind].table)
      .update(values)
      .eq("id", id)
      .eq("plantation_id", plantationId)
      .eq("user_id", uid)
      .select("id")
  );
  return rows.length > 0;
}

export async function deleteRecord(
  uid: string,
  plantationId: string,
  kind: keyof typeof TABLES,
  id: string
): Promise<boolean> {
  if (!isUuid(id)) return false;
  const rows = unwrap<{ id: string }[]>(
    await adminDb
      .from(TABLES[kind].table)
      .delete()
      .eq("id", id)
      .eq("plantation_id", plantationId)
      .eq("user_id", uid)
      .select("id")
  );
  return rows.length > 0;
}

/** Marks every unpaid work day of a worker paid, after the planter pays them */
export async function payWorker(uid: string, plantationId: string, workerId: string): Promise<number> {
  if (!isUuid(workerId)) return 0;
  const rows = unwrap<{ id: string }[]>(
    await adminDb
      .from("plantation_work_days")
      .update({ paid: true })
      .eq("worker_id", workerId)
      .eq("plantation_id", plantationId)
      .eq("user_id", uid)
      .eq("paid", false)
      .select("id")
  );
  return rows.length;
}
