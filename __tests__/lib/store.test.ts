import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A stand-in for the service-role client's query builder: every call is
 * recorded, and awaiting the chain resolves to the next queued response, or
 * to `result` once the queue is empty.
 */
const db = vi.hoisted(() => {
  const calls: [string, ...unknown[]][] = [];
  let result: unknown = { data: null, error: null, status: 200 };
  const queue: unknown[] = [];

  const chain: Record<string, unknown> = {};
  for (const method of ["select", "eq", "insert", "upsert", "single", "maybeSingle"]) {
    chain[method] = (...args: unknown[]) => {
      calls.push([method, ...args]);
      return chain;
    };
  }
  chain.then = (resolve: (value: unknown) => unknown) =>
    resolve(queue.length > 0 ? queue.shift() : result);

  return {
    calls,
    respond(value: unknown) {
      result = value;
      queue.length = 0;
    },
    respondInTurn(...values: unknown[]) {
      queue.push(...values);
    },
    adminDb: {
      from: (table: string) => {
        calls.push(["from", table]);
        return chain;
      },
      rpc: async (name: string, args: unknown) => {
        calls.push(["rpc", name, args]);
        return result;
      },
    },
  };
});

vi.mock("@/lib/supabase/admin", () => ({ adminDb: db.adminDb }));

const { DatabaseError, getCart, insertOrder, isTransientDbError, mergeCart, saveCart } =
  await import("@/lib/supabase/store");

beforeEach(() => {
  db.calls.length = 0;
  db.respond({ data: null, error: null, status: 200 });
});

describe("queries", () => {
  it("reads only the given user's cart", async () => {
    db.respond({ data: { items: { s_tomato: 2 } }, error: null, status: 200 });

    await expect(getCart("user-1")).resolves.toEqual({ s_tomato: 2 });
    expect(db.calls).toContainEqual(["from", "carts"]);
    expect(db.calls).toContainEqual(["eq", "user_id", "user-1"]);
  });

  it("answers undefined when there is no cart yet", async () => {
    await expect(getCart("user-1")).resolves.toBeUndefined();
  });

  it("upserts the cart keyed by the user", async () => {
    await saveCart("user-1", { s_tomato: 3 });

    expect(db.calls).toContainEqual([
      "upsert",
      expect.objectContaining({ user_id: "user-1", items: { s_tomato: 3 } }),
    ]);
  });

  it("merges through the database function", async () => {
    db.respond({ data: { s_tomato: 5 }, error: null, status: 200 });

    await expect(mergeCart("user-1", { s_tomato: 5 })).resolves.toEqual({ s_tomato: 5 });
    expect(db.calls).toContainEqual([
      "rpc",
      "merge_cart",
      { p_user: "user-1", p_items: { s_tomato: 5 } },
    ]);
  });

  const order = {
    name: "Nimal",
    phone: "0771234567",
    method: "pickup" as const,
    payment_method: "bank_transfer" as const,
    address: "",
    notes: "",
    items: [],
    total: 0,
  };

  it("stores an order under the user with a fresh reference", async () => {
    db.respond({ data: { id: "order-1" }, error: null, status: 201 });

    const result = await insertOrder("user-1", order, () => "ASW-7K3P9Q");

    expect(result).toEqual({ id: "order-1", ref: "ASW-7K3P9Q" });
    expect(db.calls).toContainEqual([
      "insert",
      expect.objectContaining({
        user_id: "user-1",
        ref: "ASW-7K3P9Q",
        payment_method: "bank_transfer",
      }),
    ]);
  });

  it("tries another reference when one is already taken", async () => {
    const refs = ["ASW-AAAAAA", "ASW-BBBBBB"];
    db.respondInTurn(
      { data: null, error: { message: "duplicate key", code: "23505" }, status: 409 },
      { data: { id: "order-2" }, error: null, status: 201 }
    );

    await expect(insertOrder("user-1", order, () => refs.shift()!)).resolves.toEqual({
      id: "order-2",
      ref: "ASW-BBBBBB",
    });
  });

  it("gives up after a few taken references", async () => {
    db.respond({ data: null, error: { message: "duplicate key", code: "23505" }, status: 409 });

    await expect(insertOrder("user-1", order, () => "ASW-AAAAAA")).rejects.toMatchObject({
      name: "DatabaseError",
      code: "23505",
    });
  });

  it("throws a failed query as a DatabaseError", async () => {
    db.respond({
      data: null,
      error: { message: "relation does not exist", code: "42P01" },
      status: 404,
    });

    await expect(getCart("user-1")).rejects.toMatchObject({
      name: "DatabaseError",
      code: "42P01",
      status: 404,
    });
  });
});

describe("isTransientDbError", () => {
  it.each([
    ["no response", "", 0],
    ["a bad gateway", "", 502],
    ["an unavailable service", "", 503],
    ["a gateway timeout", "", 504],
    ["a statement timeout", "57014", 500],
    ["too many connections", "53300", 500],
  ])("retries later after %s", (_, code, status) => {
    expect(isTransientDbError(new DatabaseError("x", code, status))).toBe(true);
  });

  it.each([
    // Configuration faults have to surface, not hide behind "try again"
    ["a missing table", "42P01", 404],
    ["a missing table in the schema cache", "PGRST205", 404],
    ["a wrong secret key", "", 401],
  ])("surfaces %s", (_, code, status) => {
    expect(isTransientDbError(new DatabaseError("x", code, status))).toBe(false);
  });

  it("is false for anything that is not a DatabaseError", () => {
    expect(isTransientDbError(Object.assign(new Error("x"), { status: 503 }))).toBe(false);
    expect(isTransientDbError(null)).toBe(false);
  });
});
