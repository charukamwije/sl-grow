import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A stand-in for the service-role query builder: every call on a chain is
 * recorded under its table, and awaiting the chain resolves to that table's
 * prepared result.
 */
const db = vi.hoisted(() => {
  const calls: [string, string, ...unknown[]][] = [];
  const results = new Map<string, unknown>();

  function chain(table: string) {
    const builder: Record<string, unknown> = {};
    for (const method of ["select", "order", "range", "or", "gte", "lt", "eq", "neq", "not", "in", "maybeSingle", "overrideTypes"]) {
      builder[method] = (...args: unknown[]) => {
        calls.push([table, method, ...args]);
        return builder;
      };
    }
    builder.then = (resolve: (value: unknown) => unknown) =>
      resolve(results.get(table) ?? { data: [], error: null, status: 200, count: 0 });
    return builder;
  }

  return {
    calls,
    results,
    adminDb: { from: (table: string) => chain(table) },
  };
});

vi.mock("@/lib/supabase/admin", () => ({ adminDb: db.adminDb }));

const { getAdminOrder, listAdminOrders } = await import("@/lib/admin-orders");
const { parseOrderFilters } = await import("@/lib/order-filters");

const ROW = {
  id: "0b6f6d4e-1c1a-4c3e-9a51-6c5d8f2e7a10",
  user_id: "user-1",
  ref: "ASW-7K3P9Q",
  created_at: "2026-11-04T08:15:00+00:00",
  name: "Nimal",
  phone: "0771234567",
  method: "pickup",
  address: "",
  notes: "",
  items: [{ code: "S-TOMATO", name: "Tomato seedling", qty: 2, price: 80, lineTotal: 160 }],
  total: "160",
};

const calls = (table: string, method: string) =>
  db.calls.filter(([t, m]) => t === table && m === method).map(([, , ...args]) => args);

beforeEach(() => {
  db.calls.length = 0;
  db.results.clear();
});

describe("listAdminOrders", () => {
  it("lists every customer's orders, newest first, with the account email", async () => {
    db.results.set("orders", { data: [ROW], error: null, status: 200, count: 1 });
    db.results.set("profiles", {
      data: [{ user_id: "user-1", email: "nimal@example.com" }],
      error: null,
      status: 200,
    });

    const result = await listAdminOrders(parseOrderFilters({}));

    expect(result.total).toBe(1);
    expect(result.orders[0]).toMatchObject({
      ref: "ASW-7K3P9Q",
      createdAt: "2026-11-04T08:15:00.000Z",
      total: 160,
      accountEmail: "nimal@example.com",
    });
    expect(calls("orders", "order")).toEqual([["created_at", { ascending: false }]]);
    expect(calls("orders", "range")).toEqual([[0, 49]]);
    expect(calls("orders", "eq")).toEqual([]);
  });

  it("searches the reference, phone and name together", async () => {
    await listAdminOrders(parseOrderFilters({ q: "ASW-7K" }));

    expect(calls("orders", "or")).toEqual([
      ["ref.ilike.*ASW-7K*,phone.ilike.*ASW-7K*,name.ilike.*ASW-7K*"],
    ]);
  });

  it("includes the whole last day of a date range", async () => {
    await listAdminOrders(parseOrderFilters({ from: "2026-11-01", to: "2026-11-30" }));

    expect(calls("orders", "gte")).toEqual([["created_at", "2026-11-01T00:00:00Z"]]);
    expect(calls("orders", "lt")).toEqual([["created_at", "2026-12-01T00:00:00.000Z"]]);
  });

  it("filters by status, and finds slips waiting to be checked", async () => {
    await listAdminOrders(parseOrderFilters({ status: "created", payment: "receipt" }));

    expect(calls("orders", "eq")).toEqual([
      ["status", "created"],
      ["paid", false],
    ]);
    expect(calls("orders", "neq")).toEqual([["status", "cancelled"]]);
    expect(calls("orders", "not")).toEqual([["receipt_path", "is", null]]);
  });

  it("pages 50 at a time", async () => {
    await listAdminOrders(parseOrderFilters({ page: "3" }));

    expect(calls("orders", "range")).toEqual([[100, 149]]);
  });

  it("marks an order whose account is gone", async () => {
    db.results.set("orders", { data: [ROW], error: null, status: 200, count: 1 });

    const { orders } = await listAdminOrders(parseOrderFilters({}));

    expect(orders[0].accountEmail).toBeNull();
  });

  it("throws a failed query", async () => {
    db.results.set("orders", {
      data: null,
      error: { message: "timeout", code: "57014" },
      status: 500,
      count: null,
    });

    await expect(listAdminOrders(parseOrderFilters({}))).rejects.toMatchObject({
      name: "DatabaseError",
      code: "57014",
    });
  });
});

describe("getAdminOrder", () => {
  it("finds an order by its id", async () => {
    db.results.set("orders", { data: ROW, error: null, status: 200 });

    await expect(getAdminOrder(ROW.id)).resolves.toMatchObject({ ref: "ASW-7K3P9Q" });
    expect(calls("orders", "eq")).toEqual([["id", ROW.id]]);
  });

  it("answers null for an id that is not a UUID, without asking the database", async () => {
    await expect(getAdminOrder("not-an-id")).resolves.toBeNull();
    expect(db.calls).toEqual([]);
  });
});
