// Fails the build if this module is ever pulled into a client bundle
import "server-only";
import type { OrderStatus, PaymentMethod } from "./order/checkout";
import type { OrderFilters } from "./order-filters";
import { adminDb } from "./supabase/admin";
import { DatabaseError } from "./supabase/store";

export const ORDERS_PER_PAGE = 50;

export type AdminOrderItem = {
  code: string;
  name: string;
  qty: number;
  price: number;
  lineTotal: number;
};

export type AdminOrder = {
  id: string;
  ref: string | null;
  createdAt: string;
  name: string;
  phone: string;
  method: "pickup" | "delivery";
  address: string;
  notes: string;
  items: AdminOrderItem[];
  total: number;
  payment: PaymentMethod;
  status: OrderStatus;
  paid: boolean;
  paidAt: string | null;
  /** Storage path of the bank transfer slip, if one was sent */
  receiptPath: string | null;
  receiptUploadedAt: string | null;
  statusUpdatedAt: string | null;
  /** The signed-in account it was sent from, if it still exists */
  accountEmail: string | null;
};

type OrderRow = {
  id: string;
  user_id: string;
  ref: string | null;
  created_at: string;
  name: string;
  phone: string;
  method: "pickup" | "delivery";
  address: string;
  notes: string;
  items: AdminOrderItem[];
  total: number | string;
  payment_method: PaymentMethod;
  status: OrderStatus;
  paid: boolean;
  paid_at: string | null;
  receipt_path: string | null;
  receipt_uploaded_at: string | null;
  status_updated_at: string | null;
};

const COLUMNS =
  "id, user_id, ref, created_at, name, phone, method, address, notes, items, total, payment_method, status, paid, paid_at, receipt_path, receipt_uploaded_at, status_updated_at";

function toOrder(row: OrderRow, emails: Map<string, string>): AdminOrder {
  return {
    id: row.id,
    ref: row.ref,
    createdAt: new Date(row.created_at).toISOString(),
    name: row.name,
    phone: row.phone,
    method: row.method,
    address: row.address,
    notes: row.notes,
    items: row.items,
    total: Number(row.total),
    payment: row.payment_method,
    status: row.status,
    paid: row.paid,
    paidAt: row.paid_at,
    receiptPath: row.receipt_path,
    receiptUploadedAt: row.receipt_uploaded_at,
    statusUpdatedAt: row.status_updated_at,
    accountEmail: emails.get(row.user_id) ?? null,
  };
}

// Orders and profiles both hang off auth.users, not off each other, so
// PostgREST cannot embed one in the other; the emails come in one extra query
async function emailsFor(userIds: string[]): Promise<Map<string, string>> {
  const emails = new Map<string, string>();
  const ids = [...new Set(userIds)];
  if (ids.length === 0) return emails;

  const { data, error, status } = await adminDb
    .from("profiles")
    .select("user_id, email")
    .in("user_id", ids)
    .overrideTypes<{ user_id: string; email: string | null }[], { merge: false }>();

  if (error) throw new DatabaseError(error.message, error.code ?? "", status);

  for (const row of data) {
    if (row.email) emails.set(row.user_id, row.email);
  }
  return emails;
}

/** One page of every customer's orders, newest first */
export async function listAdminOrders(
  filters: OrderFilters
): Promise<{ orders: AdminOrder[]; total: number }> {
  const start = (filters.page - 1) * ORDERS_PER_PAGE;

  let query = adminDb
    .from("orders")
    .select(COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(start, start + ORDERS_PER_PAGE - 1);

  if (filters.q) {
    // parseOrderFilters left only characters with no meaning to PostgREST
    const pattern = `*${filters.q}*`;
    query = query.or(
      `ref.ilike.${pattern},phone.ilike.${pattern},name.ilike.${pattern}`
    );
  }
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.payment === "paid") query = query.eq("paid", true);
  if (filters.payment === "unpaid") query = query.eq("paid", false);
  if (filters.payment === "receipt") {
    query = query.eq("paid", false).neq("status", "cancelled").not("receipt_path", "is", null);
  }
  if (filters.from) {
    query = query.gte("created_at", `${filters.from}T00:00:00Z`);
  }
  if (filters.to) {
    // Inclusive: everything before the start of the next day
    const next = new Date(`${filters.to}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    query = query.lt("created_at", next.toISOString());
  }

  const { data, error, status, count } = await query.overrideTypes<
    OrderRow[],
    { merge: false }
  >();

  if (error) throw new DatabaseError(error.message, error.code ?? "", status);

  const emails = await emailsFor(data.map((row) => row.user_id));

  return { orders: data.map((row) => toOrder(row, emails)), total: count ?? 0 };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getAdminOrder(id: string): Promise<AdminOrder | null> {
  // Anything else would make Postgres reject the query instead of finding nothing
  if (!UUID.test(id)) return null;

  const { data, error, status } = await adminDb
    .from("orders")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle<OrderRow>();

  if (error) throw new DatabaseError(error.message, error.code ?? "", status);
  if (!data) return null;

  return toOrder(data, await emailsFor([data.user_id]));
}

function fail(error: { message: string; code?: string }, status: number): never {
  throw new DatabaseError(error.message, error.code ?? "", status);
}

/** Returns false when there is no such order */
export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  actorId: string
): Promise<boolean> {
  const now = new Date().toISOString();
  const { data, error, status: httpStatus } = await adminDb
    .from("orders")
    .update({ status, status_updated_at: now, updated_by: actorId })
    .eq("id", id)
    .select("id");

  if (error) fail(error, httpStatus);
  return (data ?? []).length > 0;
}

/** Returns false when there is no such order */
export async function updateOrderPaid(id: string, paid: boolean, actorId: string): Promise<boolean> {
  const { data, error, status } = await adminDb
    .from("orders")
    .update({ paid, paid_at: paid ? new Date().toISOString() : null, updated_by: actorId })
    .eq("id", id)
    .select("id");

  if (error) fail(error, status);
  return (data ?? []).length > 0;
}

/** For the dashboard: orders nobody has looked at, and slips to check */
export async function countOrdersNeedingAttention(): Promise<{ created: number; receipts: number }> {
  const [created, receipts] = await Promise.all([
    adminDb.from("orders").select("id", { count: "exact", head: true }).eq("status", "created"),
    adminDb
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("paid", false)
      .neq("status", "cancelled")
      .not("receipt_path", "is", null),
  ]);

  if (created.error) fail(created.error, created.status);
  if (receipts.error) fail(receipts.error, receipts.status);

  return { created: created.count ?? 0, receipts: receipts.count ?? 0 };
}
