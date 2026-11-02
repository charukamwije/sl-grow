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

const { POST } = await import("@/app/api/orders/route");

const DEFAULT_HEADERS = {
  host: "example.com",
  origin: "https://example.com",
  "content-type": "application/json",
};

const details = {
  name: "Nimal",
  phone: "0771234567",
  method: "pickup",
  address: "",
  notes: "",
};

function orderRequest(
  body: unknown,
  headers: Record<string, string> = DEFAULT_HEADERS
) {
  return new NextRequest("https://example.com/api/orders", {
    method: "POST",
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

beforeEach(() => {
  vi.clearAllMocks();
  cookieJar.reset();
  firestoreDouble.reset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/orders", () => {
  it("rejects a cross-site request", async () => {
    givenSession("user-1");

    const response = await POST(
      orderRequest({ details, cart: { s_tomato: 1 } }, {
        ...DEFAULT_HEADERS,
        origin: "https://attacker.example",
      })
    );

    expect(response.status).toBe(403);
    expect(firestoreDouble.add).not.toHaveBeenCalled();
  });

  it("stores nothing for a guest (AC-17)", async () => {
    const response = await POST(orderRequest({ details, cart: { s_tomato: 1 } }));

    expect(response.status).toBe(401);
    expect(firestoreDouble.add).not.toHaveBeenCalled();
  });

  it("saves the order under the session's uid with catalogue prices (BR-21)", async () => {
    givenSession("user-1");

    const response = await POST(
      orderRequest({
        uid: "user-2",
        details,
        // A client-sent price must be ignored
        cart: { s_tomato: 2, f_compost: 1 },
        prices: { s_tomato: 1 },
      })
    );

    expect(response.status).toBe(200);
    expect(firestoreDouble.add).toHaveBeenCalledWith(
      "users/user-1/orders",
      expect.objectContaining({
        name: "Nimal",
        phone: "0771234567",
        method: "pickup",
        items: [
          { code: "S-TOMATO", name: "Tomato seedling (Thakkali)", qty: 2, price: 80, lineTotal: 160 },
          { code: "F-COMPOST", name: "Compost (10 kg bag)", qty: 1, price: 650, lineTotal: 650 },
        ],
        total: 810,
      })
    );
  });

  it("stores the reference the customer was given in WhatsApp", async () => {
    givenSession("user-1");

    const response = await POST(
      orderRequest({ details, cart: { s_tomato: 1 }, ref: "ASW-7K3P9Q" })
    );

    await expect(response.json()).resolves.toMatchObject({ success: true, ref: "ASW-7K3P9Q" });
    expect(firestoreDouble.add).toHaveBeenCalledWith(
      "users/user-1/orders",
      expect.objectContaining({ ref: "ASW-7K3P9Q" })
    );
  });

  it("replaces a malformed reference instead of storing it", async () => {
    givenSession("user-1");

    const response = await POST(
      orderRequest({ details, cart: { s_tomato: 1 }, ref: "<script>" })
    );

    const { ref } = await response.json();
    expect(ref).toMatch(/^ASW-[2-9A-HJKMNP-TW-Z]{6}$/);
    expect(firestoreDouble.add).toHaveBeenCalledWith(
      "users/user-1/orders",
      expect.objectContaining({ ref })
    );
  });

  it("refuses an order without a name or phone", async () => {
    givenSession("user-1");

    const response = await POST(
      orderRequest({ details: { ...details, name: " " }, cart: { s_tomato: 1 } })
    );

    expect(response.status).toBe(400);
    expect(firestoreDouble.add).not.toHaveBeenCalled();
  });

  it("refuses a delivery without an address", async () => {
    givenSession("user-1");

    const response = await POST(
      orderRequest({
        details: { ...details, method: "delivery" },
        cart: { s_tomato: 1 },
      })
    );

    expect(response.status).toBe(400);
  });

  it("refuses an empty cart", async () => {
    givenSession("user-1");

    const response = await POST(orderRequest({ details, cart: { nope: 2 } }));

    expect(response.status).toBe(400);
  });

  it("drops the address of a pickup order", async () => {
    givenSession("user-1");

    await POST(
      orderRequest({
        details: { ...details, address: "12 Galle Road" },
        cart: { s_tomato: 1 },
      })
    );

    expect(firestoreDouble.add).toHaveBeenCalledWith(
      "users/user-1/orders",
      expect.objectContaining({ address: "" })
    );
  });
});
