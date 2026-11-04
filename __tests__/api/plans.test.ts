import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { computePlan, defaultInputs } from "@/lib/planner/calc";
import { STATIC_CATALOG } from "@/lib/products";
import { cookieJar } from "../helpers/cookie-jar";
import { stubSupabaseEnv, supabaseDouble } from "../helpers/supabase-double";

vi.mock("@/lib/catalog-server", async () => {
  const { STATIC_CATALOG } = await import("@/lib/products");
  return { getCatalog: async () => STATIC_CATALOG };
});
vi.mock("@/lib/supabase/admin", async () => {
  const { supabaseDouble } = await import("../helpers/supabase-double");
  return { adminDb: supabaseDouble.admin };
});
vi.mock("@/lib/supabase/server", async () => {
  const { supabaseDouble } = await import("../helpers/supabase-double");
  return { createClient: async () => supabaseDouble.client };
});
vi.mock("@/lib/supabase/store", async (importOriginal) => {
  const { supabaseDouble } = await import("../helpers/supabase-double");
  return { ...(await importOriginal<object>()), ...supabaseDouble.store };
});
vi.mock("next/headers", async () => {
  const { cookieJar } = await import("../helpers/cookie-jar");
  return { cookies: async () => cookieJar.store };
});

const { POST } = await import("@/app/api/plans/route");

const DEFAULT_HEADERS = {
  host: "example.com",
  origin: "https://example.com",
  "content-type": "application/json",
};

function planRequest(body: unknown) {
  return new NextRequest("https://example.com/api/plans", {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(body),
  });
}

function givenSession(uid: string) {
  supabaseDouble.givenUser(uid);
}

beforeEach(() => {
  vi.clearAllMocks();
  cookieJar.reset();
  supabaseDouble.reset();
  stubSupabaseEnv();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/plans", () => {
  it("requires sign-in (FR-A-07)", async () => {
    const response = await POST(planRequest({ inputs: defaultInputs() }));

    expect(response.status).toBe(401);
    expect(supabaseDouble.store.insertPlan).not.toHaveBeenCalled();
  });

  it("stores the plan recomputed on the server under the session's uid", async () => {
    givenSession("user-1");
    const inputs = defaultInputs();

    const response = await POST(
      // A client-sent total must be ignored
      planRequest({ inputs, total: 1, uid: "user-2" })
    );

    expect(response.status).toBe(200);
    expect(supabaseDouble.store.insertPlan).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        people: 4,
        space: 60,
        total: computePlan(inputs, STATIC_CATALOG).shoppingTotal,
      })
    );
  });

  it("refuses a plan with no vegetable selected", async () => {
    givenSession("user-1");
    const inputs = defaultInputs();
    for (const veg of Object.values(inputs.veg)) veg.selected = false;

    const response = await POST(planRequest({ inputs }));

    expect(response.status).toBe(400);
  });

  it("refuses a malformed body", async () => {
    givenSession("user-1");

    const response = await POST(planRequest({ inputs: "nope" }));

    expect(response.status).toBe(400);
  });
});
