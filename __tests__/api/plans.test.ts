import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_COOKIE_NAME } from "@/lib/firebase/session";
import { computePlan, defaultInputs } from "@/lib/planner/calc";
import { cookieJar } from "../helpers/cookie-jar";
import { firestoreDouble } from "../helpers/firestore-double";

const adminAuth = vi.hoisted(() => ({
  verifySessionCookie: vi.fn(),
}));

vi.mock("@/lib/firebase/admin", async () => {
  const { firestoreDouble } = await import("../helpers/firestore-double");
  return { adminAuth, adminDb: firestoreDouble.adminDb };
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
  cookieJar.store.set({ name: SESSION_COOKIE_NAME, value: "session-cookie" });
  adminAuth.verifySessionCookie.mockResolvedValue({
    uid,
    firebase: { sign_in_provider: "google.com" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  cookieJar.reset();
  firestoreDouble.reset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/plans", () => {
  it("requires sign-in (FR-A-07)", async () => {
    const response = await POST(planRequest({ inputs: defaultInputs() }));

    expect(response.status).toBe(401);
    expect(firestoreDouble.add).not.toHaveBeenCalled();
  });

  it("stores the plan recomputed on the server under the session's uid", async () => {
    givenSession("user-1");
    const inputs = defaultInputs();

    const response = await POST(
      // A client-sent total must be ignored
      planRequest({ inputs, total: 1, uid: "user-2" })
    );

    expect(response.status).toBe(200);
    expect(firestoreDouble.add).toHaveBeenCalledWith(
      "users/user-1/plans",
      expect.objectContaining({
        people: 4,
        space: 60,
        total: computePlan(inputs).shoppingTotal,
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
