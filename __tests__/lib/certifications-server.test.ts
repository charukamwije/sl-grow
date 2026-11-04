import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A stand-in for the service-role query builder: every call is recorded
 * under its table, and each awaited query takes the next queued response.
 */
const db = vi.hoisted(() => {
  const calls: [string, string, ...unknown[]][] = [];
  const queue: unknown[] = [];

  function chain(table: string) {
    const builder: Record<string, unknown> = {};
    for (const method of ["select", "insert", "update", "eq", "in", "order", "single", "maybeSingle", "overrideTypes"]) {
      builder[method] = (...args: unknown[]) => {
        calls.push([table, method, ...args]);
        return builder;
      };
    }
    builder.then = (resolve: (value: unknown) => unknown) =>
      resolve(queue.shift() ?? { data: null, error: null, status: 200 });
    return builder;
  }

  return { calls, queue, adminDb: { from: (table: string) => chain(table) } };
});

vi.mock("@/lib/supabase/admin", () => ({ adminDb: db.adminDb }));

const {
  AlreadyCertifiedError,
  createApplication,
  getCertificate,
  OpenApplicationError,
  updateApplicationStatus,
} = await import("@/lib/certifications-server");

const updates = () =>
  db.calls.filter(([, method]) => method === "update").map(([, , values]) => values as Record<string, unknown>);

const APPLICATION = {
  track: "seeds" as const,
  name: "Kamala",
  phone: "0771234567",
  location: "Kandy",
  notes: "",
};

beforeEach(() => {
  db.calls.length = 0;
  db.queue.length = 0;
});

describe("createApplication", () => {
  it("saves a first application with a fresh reference", async () => {
    db.queue.push(
      { data: [], error: null, status: 200 },
      { data: { id: "app-1" }, error: null, status: 201 }
    );

    await expect(createApplication("user-1", APPLICATION, () => "APP-7K3P9Q")).resolves.toEqual({
      id: "app-1",
      ref: "APP-7K3P9Q",
    });
    expect(db.calls).toContainEqual([
      "certification_applications",
      "insert",
      { user_id: "user-1", ref: "APP-7K3P9Q", ...APPLICATION },
    ]);
  });

  it("refuses a second open application for the same path", async () => {
    db.queue.push({ data: [{ status: "in_review", expires_at: null }], error: null, status: 200 });

    await expect(createApplication("user-1", APPLICATION)).rejects.toBeInstanceOf(OpenApplicationError);
  });

  it("refuses while a certificate for the path is still valid", async () => {
    db.queue.push({
      data: [{ status: "certified", expires_at: "2099-01-01T00:00:00Z" }],
      error: null,
      status: 200,
    });

    await expect(createApplication("user-1", APPLICATION)).rejects.toBeInstanceOf(AlreadyCertifiedError);
  });

  it("allows applying again after a rejection or an expired certificate", async () => {
    db.queue.push(
      {
        data: [
          { status: "rejected", expires_at: null },
          { status: "certified", expires_at: "2020-01-01T00:00:00Z" },
        ],
        error: null,
        status: 200,
      },
      { data: { id: "app-2" }, error: null, status: 201 }
    );

    await expect(createApplication("user-1", APPLICATION, () => "APP-AAAAAA")).resolves.toMatchObject({
      id: "app-2",
    });
  });

  it("treats losing the race to the one-open-application index as an open application", async () => {
    db.queue.push(
      { data: [], error: null, status: 200 },
      {
        data: null,
        error: { code: "23505", message: 'duplicate key value violates unique constraint "certification_applications_one_open"' },
        status: 409,
      }
    );

    await expect(createApplication("user-1", APPLICATION)).rejects.toBeInstanceOf(OpenApplicationError);
  });
});

describe("updateApplicationStatus", () => {
  const EXPIRES = "2028-11-04T23:59:59.999Z";

  it("issues a certificate code the first time an application is certified", async () => {
    db.queue.push(
      { data: { certificate_code: null, certified_at: null }, error: null, status: 200 },
      { data: [{ id: "app-1" }], error: null, status: 200 }
    );

    await expect(
      updateApplicationStatus("app-1", { status: "certified", note: "", expiresAt: EXPIRES }, "staff", () => "ASW-C-7K3P9Q")
    ).resolves.toBe(true);

    expect(updates()[0]).toMatchObject({
      status: "certified",
      certificate_code: "ASW-C-7K3P9Q",
      expires_at: EXPIRES,
      updated_by: "staff",
    });
    expect(updates()[0].certified_at).toEqual(expect.any(String));
  });

  it("keeps the code and first issue date when certifying again", async () => {
    db.queue.push(
      { data: { certificate_code: "ASW-C-OLDOLD", certified_at: "2026-01-01T00:00:00Z" }, error: null, status: 200 },
      { data: [{ id: "app-1" }], error: null, status: 200 }
    );
    const makeCode = vi.fn(() => "ASW-C-NEWNEW");

    await updateApplicationStatus("app-1", { status: "certified", note: "", expiresAt: EXPIRES }, "staff", makeCode);

    expect(makeCode).not.toHaveBeenCalled();
    expect(updates()[0]).toMatchObject({
      certificate_code: "ASW-C-OLDOLD",
      certified_at: "2026-01-01T00:00:00Z",
    });
  });

  it("leaves the certificate fields alone for other statuses, so a shared link shows it revoked", async () => {
    db.queue.push(
      { data: { certificate_code: "ASW-C-OLDOLD", certified_at: "2026-01-01T00:00:00Z" }, error: null, status: 200 },
      { data: [{ id: "app-1" }], error: null, status: 200 }
    );

    await updateApplicationStatus("app-1", { status: "on_hold", note: "Checking", expiresAt: null }, "staff");

    expect(updates()[0]).toEqual({
      status: "on_hold",
      admin_note: "Checking",
      status_updated_at: expect.any(String),
      updated_by: "staff",
    });
  });

  it("makes another code when a fresh one is already taken", async () => {
    db.queue.push(
      { data: { certificate_code: null, certified_at: null }, error: null, status: 200 },
      { data: null, error: { code: "23505", message: "duplicate key" }, status: 409 },
      { data: [{ id: "app-1" }], error: null, status: 200 }
    );
    const codes = ["ASW-C-AAAAAA", "ASW-C-BBBBBB"];

    await updateApplicationStatus("app-1", { status: "certified", note: "", expiresAt: EXPIRES }, "staff", () => codes.shift()!);

    expect(updates().map((values) => values.certificate_code)).toEqual(["ASW-C-AAAAAA", "ASW-C-BBBBBB"]);
  });

  it("answers false for an application that does not exist", async () => {
    db.queue.push({ data: null, error: null, status: 200 });

    await expect(
      updateApplicationStatus("missing", { status: "in_review", note: "", expiresAt: null }, "staff")
    ).resolves.toBe(false);
    expect(updates()).toEqual([]);
  });
});

describe("getCertificate", () => {
  it("shows only what the public page needs, with its state", async () => {
    db.queue.push({
      data: {
        user_id: "user-1",
        name: "Kamala",
        track: "seeds",
        status: "certified",
        certificate_code: "ASW-C-7K3P9Q",
        certified_at: "2026-11-04T10:00:00+00:00",
        expires_at: "2020-01-01T00:00:00+00:00",
      },
      error: null,
      status: 200,
    });

    await expect(getCertificate("ASW-C-7K3P9Q")).resolves.toEqual({
      code: "ASW-C-7K3P9Q",
      name: "Kamala",
      track: "seeds",
      issuedAt: "2026-11-04T10:00:00.000Z",
      expiresAt: "2020-01-01T00:00:00.000Z",
      state: "expired",
      ownerId: "user-1",
    });
    // The phone number and district are not even read
    const select = db.calls.find(([, method]) => method === "select")!;
    expect(select[2]).not.toMatch(/phone|location/);
  });

  it("answers null for an unknown code", async () => {
    db.queue.push({ data: null, error: null, status: 200 });

    await expect(getCertificate("ASW-C-222222")).resolves.toBeNull();
  });
});
