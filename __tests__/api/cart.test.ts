import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_COOKIE_NAME } from "@/lib/firebase/session";
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

const { GET, PUT } = await import("@/app/api/cart/route");
const { POST: MERGE } = await import("@/app/api/cart/merge/route");

const DEFAULT_HEADERS = {
  host: "example.com",
  origin: "https://example.com",
  "content-type": "application/json",
};

function cartRequest(
  path: string,
  method: "PUT" | "POST",
  body: unknown,
  headers: Record<string, string> = DEFAULT_HEADERS
) {
  return new NextRequest(`https://example.com${path}`, {
    method,
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function givenSession(uid: string) {
  cookieJar.store.set({ name: SESSION_COOKIE_NAME, value: "session-cookie" });
  adminAuth.verifySessionCookie.mockResolvedValue({
    uid,
    firebase: { sign_in_provider: "google.com" },
  });
}

function givenCloudCart(uid: string, items: Record<string, number>) {
  firestoreDouble.docs.set(`users/${uid}/meta/cart`, { items });
}

beforeEach(() => {
  vi.clearAllMocks();
  cookieJar.reset();
  firestoreDouble.reset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/cart", () => {
  it("answers 401 when signed out", async () => {
    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns only the caller's own cart", async () => {
    givenSession("user-1");
    givenCloudCart("user-1", { s_tomato: 2 });
    givenCloudCart("user-2", { t_ph: 1 });

    const response = await GET();

    await expect(response.json()).resolves.toEqual({
      success: true,
      cart: { s_tomato: 2 },
    });
  });

  it("drops unknown products and bad quantities from a stored cart", async () => {
    givenSession("user-1");
    givenCloudCart("user-1", { s_tomato: 2, nope: 3, t_ph: -1 });

    const response = await GET();

    await expect(response.json()).resolves.toEqual({
      success: true,
      cart: { s_tomato: 2 },
    });
  });
});

describe("PUT /api/cart", () => {
  it("rejects a cross-site request", async () => {
    givenSession("user-1");

    const response = await PUT(
      cartRequest("/api/cart", "PUT", { cart: {} }, {
        ...DEFAULT_HEADERS,
        origin: "https://attacker.example",
      })
    );

    expect(response.status).toBe(403);
    expect(firestoreDouble.set).not.toHaveBeenCalled();
  });

  it("answers 401 when signed out", async () => {
    const response = await PUT(cartRequest("/api/cart", "PUT", { cart: {} }));

    expect(response.status).toBe(401);
    expect(firestoreDouble.set).not.toHaveBeenCalled();
  });

  it("saves the sanitized cart under the session's uid, ignoring any uid in the body", async () => {
    givenSession("user-1");

    const response = await PUT(
      cartRequest("/api/cart", "PUT", {
        uid: "user-2",
        cart: { s_tomato: 3, nope: 1 },
      })
    );

    expect(response.status).toBe(200);
    expect(firestoreDouble.set).toHaveBeenCalledWith(
      "users/user-1/meta/cart",
      expect.objectContaining({ items: { s_tomato: 3 } })
    );
  });

  it("refuses a body without a cart instead of emptying the stored one", async () => {
    givenSession("user-1");

    const response = await PUT(cartRequest("/api/cart", "PUT", { items: [] }));

    expect(response.status).toBe(400);
    expect(firestoreDouble.set).not.toHaveBeenCalled();
  });
});

describe("POST /api/cart/merge", () => {
  it("keeps the larger quantity of each product (BR-20, AC-14)", async () => {
    givenSession("user-1");
    givenCloudCart("user-1", { s_tomato: 2, k_gb15: 4 });

    const response = await MERGE(
      cartRequest("/api/cart/merge", "POST", {
        cart: { s_tomato: 5, k_gb15: 1, t_ph: 1 },
      })
    );

    const merged = { s_tomato: 5, k_gb15: 4, t_ph: 1 };
    await expect(response.json()).resolves.toEqual({ success: true, cart: merged });
    expect(firestoreDouble.docs.get("users/user-1/meta/cart")).toEqual(
      expect.objectContaining({ items: merged })
    );
  });

  it("starts from the device cart when there is no cloud cart yet", async () => {
    givenSession("user-1");

    const response = await MERGE(
      cartRequest("/api/cart/merge", "POST", { cart: { c_neem: 1 } })
    );

    await expect(response.json()).resolves.toEqual({
      success: true,
      cart: { c_neem: 1 },
    });
  });

  it("answers 401 when signed out", async () => {
    const response = await MERGE(
      cartRequest("/api/cart/merge", "POST", { cart: { c_neem: 1 } })
    );

    expect(response.status).toBe(401);
  });
});
