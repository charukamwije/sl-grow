// Fails the build if this module is ever pulled into a client bundle
import "server-only";
import { generateOrderRef } from "../order/reference";
import type { PaymentMethod } from "../order/checkout";
import type { Cart } from "../products";
import { adminDb } from "./admin";

/**
 * Everything a customer owns sits in rows keyed by their uid (see
 * supabase/migrations): `carts` (FR-A-04), `orders` (FR-A-05) and `plans`
 * (FR-A-08).
 *
 * These helpers scope every query to whatever uid they are handed, so
 * ownership (FR-A-11) rests entirely on every caller passing the uid from the
 * verified session, never one taken from a request body or path segment.
 */

/** A failed query, with the HTTP status it came back with (0: no response) */
export class DatabaseError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number
  ) {
    super(message);
    this.name = "DatabaseError";
  }
}

type QueryResult<T> = {
  data: T | null;
  error: { message: string; code?: string } | null;
  status: number;
};

// supabase-js answers with `{ data, error }` instead of throwing. Without an
// error, `data` is only null where the query allows it (`maybeSingle`), and
// those callers say so in `T`.
function unwrap<T>({ data, error, status }: QueryResult<T>): T {
  if (error) {
    throw new DatabaseError(error.message, error.code ?? "", status);
  }

  return data as T;
}

/** The stored cart, unsanitized, or undefined when there is none */
export async function getCart(uid: string): Promise<unknown> {
  const row = unwrap<{ items: unknown } | null>(
    await adminDb
      .from("carts")
      .select("items")
      .eq("user_id", uid)
      .maybeSingle<{ items: unknown }>()
  );

  return row?.items;
}

export async function saveCart(uid: string, items: Cart): Promise<void> {
  unwrap(
    await adminDb.from("carts").upsert({
      user_id: uid,
      items,
      updated_at: new Date().toISOString(),
    })
  );
}

/** BR-20, atomically in the database; returns the merged cart, unsanitized */
export async function mergeCart(uid: string, items: Cart): Promise<unknown> {
  return unwrap(
    await adminDb.rpc("merge_cart", { p_user: uid, p_items: items })
  );
}

export type NewOrder = {
  name: string;
  phone: string;
  method: "pickup" | "delivery";
  payment_method: PaymentMethod;
  address: string;
  notes: string;
  items: {
    code: string;
    name: string;
    qty: number;
    price: number;
    lineTotal: number;
  }[];
  total: number;
};

// A reference is 6 characters from 30, so a clash is rare; a few tries makes
// one that keeps clashing a sign of something else wrong
const REF_ATTEMPTS = 3;

/**
 * Saves a new order (status `created`, unpaid) under a fresh reference and
 * returns its id and reference. A reference already taken is retried with a
 * new one: the unique index makes the database the judge.
 */
export async function insertOrder(
  uid: string,
  order: NewOrder,
  makeRef: () => string = generateOrderRef
): Promise<{ id: string; ref: string }> {
  for (let attempt = 1; ; attempt++) {
    const ref = makeRef();
    const result = await adminDb
      .from("orders")
      .insert({ user_id: uid, ref, ...order })
      .select("id")
      .single<{ id: string }>();

    if (result.error?.code === "23505" && attempt < REF_ATTEMPTS) continue;

    return { id: unwrap(result).id, ref };
  }
}

export type NewPlan = {
  people: number;
  space: number;
  vegetables: unknown;
  plants: Record<string, number>;
  shopping: unknown;
  total: number;
  yearly_savings: number;
};

/** Saves a plan and returns its id */
export async function insertPlan(uid: string, plan: NewPlan): Promise<string> {
  const row = unwrap(
    await adminDb
      .from("plans")
      .insert({ user_id: uid, ...plan })
      .select("id")
      .single<{ id: string }>()
  );

  return row.id;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ids come from URLs; anything else would be a Postgres error, not a miss */
export function isUuid(value: string): boolean {
  return UUID.test(value);
}

/** Replaces one of the customer's own plans; false when they have none by that id */
export async function updatePlan(uid: string, id: string, plan: NewPlan): Promise<boolean> {
  if (!isUuid(id)) return false;

  const rows = unwrap(
    await adminDb
      .from("plans")
      .update({ ...plan, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", uid)
      .select("id")
  );

  return rows.length > 0;
}

/** Deletes one of the customer's own plans; false when they have none by that id */
export async function deletePlan(uid: string, id: string): Promise<boolean> {
  if (!isUuid(id)) return false;

  const rows = unwrap(
    await adminDb.from("plans").delete().eq("id", id).eq("user_id", uid).select("id")
  );

  return rows.length > 0;
}

// An allow-list, not a deny-list: a missing table (`42P01`, `PGRST205`), a
// wrong secret key (401) and anything unrecognised are configuration or
// programming faults that have to surface, not be retried or masked as "try
// again later".
const transientStatuses = [0, 502, 503, 504];
const transientCodes = [
  "57014", // statement timeout
  "53300", // too many connections
  "57P03", // database starting up
];

export function isTransientDbError(error: unknown): boolean {
  return (
    error instanceof DatabaseError &&
    (transientStatuses.includes(error.status) ||
      transientCodes.includes(error.code))
  );
}
