import { beforeEach, describe, expect, it, vi } from "vitest";
import { stubSupabaseEnv, supabaseDouble } from "../helpers/supabase-double";

const orders = vi.hoisted(() => ({ updateOrderStatus: vi.fn(), updateOrderPaid: vi.fn() }));
const settings = vi.hoisted(() => ({ saveBankDetails: vi.fn() }));

vi.mock("@/lib/supabase/admin", async () => {
  const { supabaseDouble } = await import("../helpers/supabase-double");
  return { adminDb: supabaseDouble.admin };
});
vi.mock("@/lib/supabase/server", async () => {
  const { supabaseDouble } = await import("../helpers/supabase-double");
  return { createClient: async () => supabaseDouble.client };
});
vi.mock("@/lib/admin-orders", () => orders);
vi.mock("@/lib/shop-settings", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  ...settings,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { setOrderPaid, setOrderStatus } = await import("@/app/admin/orders/actions");
const { updateBankDetails } = await import("@/app/admin/settings/actions");

const ORDER = "0b6f6d4e-1c1a-4c3e-9a51-6c5d8f2e7a10";

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  supabaseDouble.reset();
  stubSupabaseEnv();
  vi.spyOn(console, "error").mockImplementation(() => {});
  orders.updateOrderStatus.mockResolvedValue(true);
  orders.updateOrderPaid.mockResolvedValue(true);
  settings.saveBankDetails.mockResolvedValue(undefined);
});

describe("order status and payment", () => {
  it.each(["admin", "super_admin"] as const)("lets a %s move an order and mark it paid", async (role) => {
    supabaseDouble.givenUser("staff", { role });

    await expect(setOrderStatus(ORDER, "out_for_delivery")).resolves.toEqual({ ok: true });
    await expect(setOrderPaid(ORDER, true)).resolves.toEqual({ ok: true });

    expect(orders.updateOrderStatus).toHaveBeenCalledWith(ORDER, "out_for_delivery", "staff");
    expect(orders.updateOrderPaid).toHaveBeenCalledWith(ORDER, true, "staff");
    expect(supabaseDouble.auditRows).toEqual([
      expect.objectContaining({ action: "order.status_changed", target: ORDER, details: { status: "out_for_delivery" } }),
      expect.objectContaining({ action: "order.marked_paid", target: ORDER }),
    ]);
  });

  it("refuses a member and a guest", async () => {
    supabaseDouble.givenUser("customer", { role: "member" });
    await expect(setOrderStatus(ORDER, "completed")).resolves.toMatchObject({ ok: false });
    await expect(setOrderPaid(ORDER, true)).resolves.toMatchObject({ ok: false });

    supabaseDouble.givenSignedOut();
    await expect(setOrderStatus(ORDER, "completed")).resolves.toMatchObject({ ok: false });

    expect(orders.updateOrderStatus).not.toHaveBeenCalled();
    expect(orders.updateOrderPaid).not.toHaveBeenCalled();
  });

  it("refuses an unknown status or a non-boolean payment", async () => {
    supabaseDouble.givenUser("staff", { role: "admin" });

    await expect(setOrderStatus(ORDER, "shipped")).resolves.toMatchObject({ ok: false });
    await expect(setOrderPaid(ORDER, "yes")).resolves.toMatchObject({ ok: false });
    expect(orders.updateOrderStatus).not.toHaveBeenCalled();
    expect(orders.updateOrderPaid).not.toHaveBeenCalled();
  });

  it("records marking an order unpaid again", async () => {
    supabaseDouble.givenUser("staff", { role: "admin" });

    await setOrderPaid(ORDER, false);

    expect(supabaseDouble.auditRows).toEqual([
      expect.objectContaining({ action: "order.marked_unpaid" }),
    ]);
  });

  it("says so when the order is gone", async () => {
    supabaseDouble.givenUser("staff", { role: "admin" });
    orders.updateOrderStatus.mockResolvedValue(false);

    await expect(setOrderStatus(ORDER, "received")).resolves.toEqual({
      ok: false,
      error: "This order no longer exists.",
    });
    expect(supabaseDouble.auditRows).toEqual([]);
  });
});

describe("bank details", () => {
  function bankForm(fields: Record<string, string>) {
    const form = new FormData();
    for (const [key, value] of Object.entries(fields)) form.set(key, value);
    return form;
  }

  const FIELDS = {
    bankName: " Commercial Bank ",
    branch: "Kandy",
    accountName: "Aswedduma",
    accountNumber: "1234567890",
    note: "",
  };

  it("lets a super admin save them, trimmed, and records it", async () => {
    supabaseDouble.givenUser("boss", { role: "super_admin" });

    await expect(updateBankDetails({}, bankForm(FIELDS))).resolves.toEqual({ saved: true });

    expect(settings.saveBankDetails).toHaveBeenCalledWith(
      expect.objectContaining({ bankName: "Commercial Bank", accountNumber: "1234567890" }),
      "boss"
    );
    expect(supabaseDouble.auditRows).toEqual([
      expect.objectContaining({ action: "settings.bank_details_changed" }),
    ]);
  });

  it("refuses an admin", async () => {
    supabaseDouble.givenUser("staff", { role: "admin" });

    await expect(updateBankDetails({}, bankForm(FIELDS))).resolves.toEqual({
      error: "You do not have permission to do that.",
    });
    expect(settings.saveBankDetails).not.toHaveBeenCalled();
  });

  it("refuses a field that is too long", async () => {
    supabaseDouble.givenUser("boss", { role: "super_admin" });

    const result = await updateBankDetails({}, bankForm({ ...FIELDS, accountName: "x".repeat(121) }));

    expect(result.error).toBeDefined();
    expect(settings.saveBankDetails).not.toHaveBeenCalled();
  });
});
