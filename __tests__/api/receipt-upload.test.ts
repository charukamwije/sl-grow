import { beforeEach, describe, expect, it, vi } from "vitest";
import { stubSupabaseEnv, supabaseDouble } from "../helpers/supabase-double";

const account = vi.hoisted(() => ({ loadOwnOrder: vi.fn() }));
const receipts = vi.hoisted(() => ({ attachReceipt: vi.fn() }));

vi.mock("@/lib/supabase/admin", async () => {
  const { supabaseDouble } = await import("../helpers/supabase-double");
  return { adminDb: supabaseDouble.admin };
});
vi.mock("@/lib/supabase/server", async () => {
  const { supabaseDouble } = await import("../helpers/supabase-double");
  return { createClient: async () => supabaseDouble.client };
});
vi.mock("@/lib/supabase/account", () => account);
vi.mock("@/lib/receipts", () => receipts);
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { uploadReceipt } = await import("@/app/account/orders/actions");

const ORDER = "0b6f6d4e-1c1a-4c3e-9a51-6c5d8f2e7a10";
const PDF = [..."%PDF-1.7"].map((c) => c.charCodeAt(0));

function slip(bytes: number[]) {
  const form = new FormData();
  form.set("receipt", new File([new Uint8Array(bytes)], "slip.pdf", { type: "application/pdf" }));
  return form;
}

const openOrder = { id: ORDER, payment: "bank_transfer", status: "received", paid: false };

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  supabaseDouble.reset();
  stubSupabaseEnv();
  vi.spyOn(console, "error").mockImplementation(() => {});
  supabaseDouble.givenUser("customer");
  account.loadOwnOrder.mockResolvedValue(openOrder);
  receipts.attachReceipt.mockResolvedValue(true);
});

describe("uploadReceipt", () => {
  it("attaches a checked slip to the customer's own open order", async () => {
    await expect(uploadReceipt(ORDER, null, slip(PDF))).resolves.toEqual({ ok: true });

    expect(account.loadOwnOrder).toHaveBeenCalledWith("customer", ORDER);
    expect(receipts.attachReceipt).toHaveBeenCalledWith(
      "customer",
      ORDER,
      expect.any(Uint8Array),
      "application/pdf",
      "pdf"
    );
  });

  it("refuses someone else's order, which looks like no order at all", async () => {
    account.loadOwnOrder.mockResolvedValue(null);

    await expect(uploadReceipt(ORDER, null, slip(PDF))).resolves.toEqual({
      ok: false,
      error: "receipt.errClosed",
    });
    expect(receipts.attachReceipt).not.toHaveBeenCalled();
  });

  it.each([
    ["cash on delivery", { payment: "cod" }],
    ["paid", { paid: true }],
    ["cancelled", { status: "cancelled" }],
  ])("refuses a slip for an order that is %s", async (_, patch) => {
    account.loadOwnOrder.mockResolvedValue({ ...openOrder, ...patch });

    await expect(uploadReceipt(ORDER, null, slip(PDF))).resolves.toEqual({
      ok: false,
      error: "receipt.errClosed",
    });
    expect(receipts.attachReceipt).not.toHaveBeenCalled();
  });

  it("refuses a file that is not a photo or PDF", async () => {
    const html = [..."<!doctype html>"].map((c) => c.charCodeAt(0));

    await expect(uploadReceipt(ORDER, null, slip(html))).resolves.toEqual({
      ok: false,
      error: "receipt.errType",
    });
    expect(account.loadOwnOrder).not.toHaveBeenCalled();
  });

  it("refuses a guest", async () => {
    supabaseDouble.givenSignedOut();

    await expect(uploadReceipt(ORDER, null, slip(PDF))).resolves.toMatchObject({ ok: false });
    expect(receipts.attachReceipt).not.toHaveBeenCalled();
  });

  it("reports an order closed between the check and the save", async () => {
    receipts.attachReceipt.mockResolvedValue(false);

    await expect(uploadReceipt(ORDER, null, slip(PDF))).resolves.toEqual({
      ok: false,
      error: "receipt.errClosed",
    });
  });
});
