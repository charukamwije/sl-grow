import { beforeEach, describe, expect, it, vi } from "vitest";
import { stubSupabaseEnv, supabaseDouble } from "../helpers/supabase-double";

const store = vi.hoisted(() => ({
  createGuide: vi.fn(),
  updateGuide: vi.fn(),
  deleteGeneralGuide: vi.fn(),
  getAdminGuide: vi.fn(),
}));
const cache = vi.hoisted(() => ({
  updateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: <T,>(fn: T) => fn,
}));

vi.mock("@/lib/supabase/admin", async () => {
  const { supabaseDouble } = await import("../helpers/supabase-double");
  return { adminDb: supabaseDouble.admin };
});
vi.mock("@/lib/supabase/server", async () => {
  const { supabaseDouble } = await import("../helpers/supabase-double");
  return { createClient: async () => supabaseDouble.client };
});
vi.mock("@/lib/guides-server", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  ...store,
}));
vi.mock("@/lib/catalog-server", async () => {
  const { STATIC_CATALOG } = await import("@/lib/products");
  return { getCatalog: async () => STATIC_CATALOG };
});
vi.mock("next/cache", () => cache);
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));

const { removeGuide, saveGuide } = await import("@/app/admin/guides/actions");
const { DuplicateGuideError } = await import("@/lib/guides-server");

const draft = (patch: Record<string, unknown> = {}) =>
  JSON.stringify({
    name: { en: "Balcony herbs", si: "", ta: "" },
    icon: "🌿",
    time: null,
    steps: [
      {
        icon: "💧",
        title: { en: "Water", si: "", ta: "" },
        text: { en: "Water with [[t_can]].", si: "", ta: "" },
      },
    ],
    products: ["f_compost"],
    active: true,
    ...patch,
  });

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  supabaseDouble.reset();
  stubSupabaseEnv();
  vi.spyOn(console, "error").mockImplementation(() => {});
  store.createGuide.mockResolvedValue(undefined);
  store.updateGuide.mockResolvedValue(true);
  store.deleteGeneralGuide.mockResolvedValue(true);
  store.getAdminGuide.mockResolvedValue({ id: "tomato", kind: "vegetable", active: true });
});

describe("who may manage guides", () => {
  it.each(["admin", "super_admin"] as const)("lets a %s save and delete guides", async (role) => {
    supabaseDouble.givenUser("staff", { role });

    await expect(saveGuide("update", "tomato", draft())).resolves.toEqual({ saved: true });
    await expect(removeGuide("balcony-herbs")).resolves.toEqual({ ok: true });
    await expect(saveGuide("create", "balcony-herbs", draft())).rejects.toThrow(
      "REDIRECT /admin/guides/balcony-herbs?created=1"
    );
  });

  it("refuses a member", async () => {
    supabaseDouble.givenUser("customer", { role: "member" });

    await expect(saveGuide("update", "tomato", draft())).resolves.toEqual({
      errors: { form: "You do not have permission to do that." },
    });
    await expect(removeGuide("balcony-herbs")).resolves.toMatchObject({ ok: false });
    expect(store.updateGuide).not.toHaveBeenCalled();
    expect(store.deleteGeneralGuide).not.toHaveBeenCalled();
  });
});

describe("saveGuide", () => {
  beforeEach(() => supabaseDouble.givenUser("staff", { role: "admin" }));

  it("saves the checked guide, refreshes readers and records it", async () => {
    await saveGuide("update", "tomato", draft());

    expect(store.updateGuide).toHaveBeenCalledWith(
      "tomato",
      expect.objectContaining({ products: ["f_compost"], active: true }),
      "staff"
    );
    expect(cache.updateTag).toHaveBeenCalledWith("guides");
    expect(cache.revalidatePath).toHaveBeenCalledWith("/guides/tomato");
    expect(supabaseDouble.auditRows).toEqual([
      expect.objectContaining({ action: "guide.updated", target: "tomato" }),
    ]);
  });

  it("refuses to hide a built-in guide", async () => {
    const result = await saveGuide("update", "tomato", draft({ active: false }));

    expect(result.errors?.form).toMatch(/cannot be hidden/);
    expect(store.updateGuide).not.toHaveBeenCalled();
  });

  it("hides a guide added in the console", async () => {
    store.getAdminGuide.mockResolvedValue({ id: "balcony-herbs", kind: "general", active: true });

    await expect(saveGuide("update", "balcony-herbs", draft({ active: false }))).resolves.toEqual({
      saved: true,
    });
  });

  it("refuses a guide on show that names a product nobody can buy", async () => {
    const result = await saveGuide(
      "update",
      "tomato",
      draft({ products: ["x_gone"], steps: [{ icon: "1", title: { en: "A" }, text: { en: "Use [[y_gone]]." } }] })
    );

    expect(result.errors?.products).toContain("X-GONE");
    expect(result.errors?.products).toContain("Y-GONE");
    expect(store.updateGuide).not.toHaveBeenCalled();
  });

  it("allows such products in a hidden guide, which nobody reads", async () => {
    store.getAdminGuide.mockResolvedValue({ id: "balcony-herbs", kind: "general", active: true });

    await expect(
      saveGuide("update", "balcony-herbs", draft({ active: false, products: ["x_gone"] }))
    ).resolves.toEqual({ saved: true });
  });

  it("shows field errors without saving", async () => {
    const result = await saveGuide("update", "tomato", draft({ steps: [] }));

    expect(result.errors).toHaveProperty("stepsList");
    expect(store.updateGuide).not.toHaveBeenCalled();
  });

  it("refuses a payload that is not JSON", async () => {
    await expect(saveGuide("update", "tomato", "{")).resolves.toMatchObject({
      errors: { form: expect.any(String) },
    });
  });

  it("checks a new guide's address", async () => {
    await expect(saveGuide("create", "Bad Address!", draft())).resolves.toMatchObject({
      errors: { id: expect.any(String) },
    });
    expect(store.createGuide).not.toHaveBeenCalled();
  });

  it("reports a taken address on the address field", async () => {
    store.createGuide.mockRejectedValue(new DuplicateGuideError("A guide with the ID soil already exists."));

    await expect(saveGuide("create", "soil", draft())).resolves.toEqual({
      errors: { id: "A guide with the ID soil already exists." },
    });
  });

  it("says so when the guide was deleted meanwhile", async () => {
    store.getAdminGuide.mockResolvedValue(null);

    await expect(saveGuide("update", "balcony-herbs", draft())).resolves.toEqual({
      errors: { form: "This guide no longer exists." },
    });
  });
});

describe("removeGuide", () => {
  beforeEach(() => supabaseDouble.givenUser("staff", { role: "admin" }));

  it("explains that a built-in guide cannot be deleted", async () => {
    store.deleteGeneralGuide.mockResolvedValue(false);

    await expect(removeGuide("tomato")).resolves.toMatchObject({
      ok: false,
      error: expect.stringMatching(/Only guides added in the console/),
    });
    expect(supabaseDouble.auditRows).toEqual([]);
  });

  it("deletes and records a general guide", async () => {
    await expect(removeGuide("balcony-herbs")).resolves.toEqual({ ok: true });

    expect(store.deleteGeneralGuide).toHaveBeenCalledWith("balcony-herbs");
    expect(supabaseDouble.auditRows).toEqual([
      expect.objectContaining({ action: "guide.deleted", target: "balcony-herbs" }),
    ]);
  });
});
