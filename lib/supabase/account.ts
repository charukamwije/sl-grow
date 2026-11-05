// Fails the build if this module is ever pulled into a client bundle
import "server-only";
import type { OrderStatus, PaymentMethod } from "../order/checkout";
import { readInputs } from "../planner/inputs";
import type { PlannerInputs } from "../planner/calc";
import { adminDb } from "./admin";
import { DatabaseError, isUuid } from "./store";

export type OrderSummary = {
  id: string;
  /** Null for orders saved before references existed */
  ref: string | null;
  /** ISO string, as Postgres returns it */
  createdAt: string;
  method: "pickup" | "delivery";
  payment: PaymentMethod;
  status: OrderStatus;
  paid: boolean;
  items: { code: string; name: string; qty: number; lineTotal: number }[];
  total: number;
};

/** One order in full, for its page under the customer's account */
export type OwnOrder = OrderSummary & {
  name: string;
  phone: string;
  address: string;
  notes: string;
  items: { code: string; name: string; qty: number; price: number; lineTotal: number }[];
  receiptUploadedAt: string | null;
  statusUpdatedAt: string | null;
};

export type PlanSummary = {
  id: string;
  createdAt: string;
  people: number;
  space: number;
  total: number;
};

/** One saved plan with the inputs to show or edit it again */
export type OwnPlan = PlanSummary & {
  updatedAt: string | null;
  inputs: PlannerInputs;
};

type OrderRow = {
  id: string;
  ref: string | null;
  created_at: string;
  method: "pickup" | "delivery";
  payment_method: PaymentMethod;
  status: OrderStatus;
  paid: boolean;
  items: OwnOrder["items"];
  total: number | string;
};

type OwnOrderRow = OrderRow & {
  name: string;
  phone: string;
  address: string;
  notes: string;
  receipt_uploaded_at: string | null;
  status_updated_at: string | null;
};

const SUMMARY_COLUMNS = "id, ref, created_at, method, payment_method, status, paid, items, total";

function toSummary(row: OrderRow): OrderSummary {
  return {
    id: row.id,
    ref: row.ref,
    createdAt: new Date(row.created_at).toISOString(),
    method: row.method,
    payment: row.payment_method,
    status: row.status,
    paid: row.paid,
    items: row.items,
    total: Number(row.total),
  };
}

type PlanRow = {
  id: string;
  created_at: string;
  people: number;
  space: number;
  total: number;
};

/** FR-A-06: the customer's own orders, newest first */
export async function loadOrders(uid: string): Promise<OrderSummary[]> {
  const { data, error, status } = await adminDb
    .from("orders")
    .select(SUMMARY_COLUMNS)
    .eq("user_id", uid)
    .order("created_at", { ascending: false })
    .overrideTypes<OrderRow[], { merge: false }>();

  if (error) throw new DatabaseError(error.message, error.code ?? "", status);

  return data.map(toSummary);
}

/** FR-A-08: the customer's saved plans, newest first */
export async function loadPlans(uid: string): Promise<PlanSummary[]> {
  const { data, error, status } = await adminDb
    .from("plans")
    .select("id, created_at, people, space, total")
    .eq("user_id", uid)
    .order("created_at", { ascending: false })
    .overrideTypes<PlanRow[], { merge: false }>();

  if (error) throw new DatabaseError(error.message, error.code ?? "", status);

  return data.map((row) => ({
    id: row.id,
    createdAt: new Date(row.created_at).toISOString(),
    people: row.people,
    space: Number(row.space),
    total: Number(row.total),
  }));
}

/**
 * One of the customer's own orders, or null - for someone else's order too,
 * so its page answers 404 rather than revealing that it exists (FR-A-11).
 */
export async function loadOwnOrder(uid: string, id: string): Promise<OwnOrder | null> {
  if (!isUuid(id)) return null;

  const { data, error, status } = await adminDb
    .from("orders")
    .select(
      `${SUMMARY_COLUMNS}, name, phone, address, notes, receipt_uploaded_at, status_updated_at`
    )
    .eq("id", id)
    .eq("user_id", uid)
    .maybeSingle<OwnOrderRow>();

  if (error) throw new DatabaseError(error.message, error.code ?? "", status);
  if (!data) return null;

  return {
    ...toSummary(data),
    items: data.items,
    name: data.name,
    phone: data.phone,
    address: data.address,
    notes: data.notes,
    receiptUploadedAt: data.receipt_uploaded_at,
    statusUpdatedAt: data.status_updated_at,
  };
}

type OwnPlanRow = PlanRow & {
  updated_at: string | null;
  vegetables: unknown;
};

/** One of the customer's own saved plans, or null (someone else's too, FR-A-11) */
export async function loadOwnPlan(uid: string, id: string): Promise<OwnPlan | null> {
  if (!isUuid(id)) return null;

  const { data, error, status } = await adminDb
    .from("plans")
    .select("id, created_at, updated_at, people, space, total, vegetables")
    .eq("id", id)
    .eq("user_id", uid)
    .maybeSingle<OwnPlanRow>();

  if (error) throw new DatabaseError(error.message, error.code ?? "", status);
  if (!data) return null;

  // Stored inputs go through the same checks as a request's
  const inputs = readInputs({ people: data.people, space: data.space, veg: data.vegetables });
  if (!inputs) return null;

  return {
    id: data.id,
    createdAt: new Date(data.created_at).toISOString(),
    updatedAt: data.updated_at,
    people: data.people,
    space: Number(data.space),
    total: Number(data.total),
    inputs,
  };
}
