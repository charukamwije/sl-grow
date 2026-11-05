import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
  payment: "cod",
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
  supabaseDouble.givenUser(uid);
}

beforeEach(() => {
  vi.clearAllMocks();
  cookieJar.reset();
  supabaseDouble.reset();
  stubSupabaseEnv();
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
    expect(supabaseDouble.store.insertOrder).not.toHaveBeenCalled();
  });

  it("asks a guest to sign in and stores nothing", async () => {
    const response = await POST(orderRequest({ details, cart: { s_tomato: 1 } }));

    expect(response.status).toBe(401);
    expect(supabaseDouble.store.insertOrder).not.toHaveBeenCalled();
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
    expect(supabaseDouble.store.insertOrder).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        name: "Nimal",
        // Saved in international form, ready for WhatsApp
        phone: "94771234567",
        method: "pickup",
        payment_method: "cod",
        items: [
          { code: "S-TOMATO", name: "Tomato seedling (Thakkali)", qty: 2, price: 80, lineTotal: 160 },
          { code: "F-COMPOST", name: "Compost (10 kg bag)", qty: 1, price: 650, lineTotal: 650 },
        ],
        total: 810,
      })
    );
  });

  it("answers with the order and the reference the server made", async () => {
    givenSession("user-1");

    const response = await POST(
      // A client-sent reference is ignored: the server makes them
      orderRequest({ details, cart: { s_tomato: 1 }, ref: "ASW-7K3P9Q" })
    );

    await expect(response.json()).resolves.toEqual({
      success: true,
      id: "new-order",
      ref: "ASW-NEW234",
    });
    expect(supabaseDouble.store.insertOrder).toHaveBeenCalledWith(
      "user-1",
      expect.not.objectContaining({ ref: expect.anything() })
    );
  });

  it("stores a bank transfer order", async () => {
    givenSession("user-1");

    await POST(
      orderRequest({ details: { ...details, payment: "bank_transfer" }, cart: { s_tomato: 1 } })
    );

    expect(supabaseDouble.store.insertOrder).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ payment_method: "bank_transfer" })
    );
  });

  it.each(["card", undefined])("refuses the payment method %p", async (payment) => {
    givenSession("user-1");

    const response = await POST(
      orderRequest({ details: { ...details, payment }, cart: { s_tomato: 1 } })
    );

    expect(response.status).toBe(400);
    expect(supabaseDouble.store.insertOrder).not.toHaveBeenCalled();
  });

  it("refuses an order without a name or phone", async () => {
    givenSession("user-1");

    const response = await POST(
      orderRequest({ details: { ...details, name: " " }, cart: { s_tomato: 1 } })
    );

    expect(response.status).toBe(400);
    expect(supabaseDouble.store.insertOrder).not.toHaveBeenCalled();
  });

  it("refuses a phone that is not a Sri Lankan mobile number", async () => {
    givenSession("user-1");

    const response = await POST(
      orderRequest({ details: { ...details, phone: "011 234 5678" }, cart: { s_tomato: 1 } })
    );

    expect(response.status).toBe(400);
    expect(supabaseDouble.store.insertOrder).not.toHaveBeenCalled();
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

    expect(supabaseDouble.store.insertOrder).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ address: "" })
    );
  });
});
