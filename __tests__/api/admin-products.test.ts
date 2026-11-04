import { beforeEach, describe, expect, it, vi } from "vitest";
import { stubSupabaseEnv, supabaseDouble } from "../helpers/supabase-double";

const store = vi.hoisted(() => ({
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
  getAdminProduct: vi.fn(),
  replaceProductImage: vi.fn(),
  clearProductImage: vi.fn(),
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
vi.mock("@/lib/admin-products", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  ...store,
}));
vi.mock("next/cache", () => cache);
vi.mock("@/lib/guides-server", async () => {
  const { PROTECTED_PRODUCT_IDS } = await import("@/lib/protected-products");
  return { getProtectedProductIds: async () => new Set(PROTECTED_PRODUCT_IDS) };
});
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));

const { removeProduct, saveProduct, uploadProductImage, deleteProductImage } =
  await import("@/app/admin/products/actions");
const { DuplicateProductError } = await import("@/lib/admin-products");

function productForm(overrides: Record<string, string | null> = {}) {
  const fields: Record<string, string | null> = {
    id: "t_rake",
    category: "tools",
    unit: "each",
    name_en: "Hand rake",
    name_si: "",
    name_ta: "",
    icon: "🧹",
    price: "550",
    vegId: "",
    active: "on",
    ...overrides,
  };
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== null) data.set(key, value);
  }
  return data;
}

function imageForm(bytes: number[]) {
  const data = new FormData();
  data.set("image", new File([new Uint8Array(bytes)], "photo.jpg", { type: "image/jpeg" }));
  return data;
}

const JPEG = [0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0];

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  supabaseDouble.reset();
  stubSupabaseEnv();
  vi.spyOn(console, "error").mockImplementation(() => {});
  store.createProduct.mockResolvedValue(undefined);
  store.updateProduct.mockResolvedValue(true);
  store.deleteProduct.mockResolvedValue(true);
  store.getAdminProduct.mockResolvedValue({ id: "t_rake" });
  store.replaceProductImage.mockResolvedValue(undefined);
  store.clearProductImage.mockResolvedValue(undefined);
});

describe("who may manage products", () => {
  it.each(["admin", "super_admin"] as const)("lets a %s use every product action", async (role) => {
    supabaseDouble.givenUser("staff", { role });

    await expect(saveProduct("update", {}, productForm())).resolves.toEqual({ saved: true });
    await expect(removeProduct("t_rake")).resolves.toEqual({ ok: true });
    await expect(uploadProductImage("t_rake", null, imageForm(JPEG))).resolves.toEqual({ ok: true });
    await expect(deleteProductImage("t_rake")).resolves.toEqual({ ok: true });
    await expect(saveProduct("create", {}, productForm())).rejects.toThrow(
      "REDIRECT /admin/products/t_rake?created=1"
    );
  });

  it("refuses a member every product action", async () => {
    supabaseDouble.givenUser("customer", { role: "member" });
    const refused = "You do not have permission to do that.";

    await expect(saveProduct("create", {}, productForm())).resolves.toEqual({
      errors: { form: refused },
    });
    await expect(removeProduct("t_rake")).resolves.toEqual({ ok: false, error: refused });
    await expect(uploadProductImage("t_rake", null, imageForm(JPEG))).resolves.toEqual({
      ok: false,
      error: refused,
    });
    await expect(deleteProductImage("t_rake")).resolves.toEqual({ ok: false, error: refused });

    expect(store.createProduct).not.toHaveBeenCalled();
    expect(store.deleteProduct).not.toHaveBeenCalled();
    expect(store.replaceProductImage).not.toHaveBeenCalled();
    expect(store.clearProductImage).not.toHaveBeenCalled();
  });

  it("refuses a guest", async () => {
    await expect(removeProduct("t_rake")).resolves.toMatchObject({ ok: false });
    expect(store.deleteProduct).not.toHaveBeenCalled();
  });
});

describe("saveProduct", () => {
  beforeEach(() => supabaseDouble.givenUser("staff", { role: "admin" }));

  it("creates the product, refreshes the shop and records it", async () => {
    await expect(saveProduct("create", {}, productForm())).rejects.toThrow("REDIRECT");

    expect(store.createProduct).toHaveBeenCalledWith(
      expect.objectContaining({ id: "t_rake", price: 550 }),
      "staff"
    );
    expect(cache.updateTag).toHaveBeenCalledWith("catalog");
    expect(supabaseDouble.auditRows).toEqual([
      expect.objectContaining({ action: "product.created", target: "t_rake" }),
    ]);
  });

  it("shows field errors without saving", async () => {
    const result = await saveProduct("create", {}, productForm({ price: "-5" }));

    expect(result.errors).toHaveProperty("price");
    expect(store.createProduct).not.toHaveBeenCalled();
  });

  it("reports a taken ID on the ID field", async () => {
    store.createProduct.mockRejectedValue(new DuplicateProductError("A product with the ID t_rake already exists."));

    await expect(saveProduct("create", {}, productForm())).resolves.toEqual({
      errors: { id: "A product with the ID t_rake already exists." },
    });
  });

  it("refuses to hide a product the planner or a guide needs", async () => {
    const result = await saveProduct("update", {}, productForm({ id: "k_gb15", active: null }));

    expect(result.errors).toHaveProperty("active");
    expect(store.updateProduct).not.toHaveBeenCalled();
  });

  it("still lets a protected product's price change", async () => {
    await expect(
      saveProduct("update", {}, productForm({ id: "k_gb15", price: "999" }))
    ).resolves.toEqual({ saved: true });
    expect(store.updateProduct).toHaveBeenCalledWith(
      expect.objectContaining({ id: "k_gb15", price: 999, active: true }),
      "staff"
    );
  });

  it("hides a product nothing depends on", async () => {
    await saveProduct("update", {}, productForm({ active: null }));

    expect(store.updateProduct).toHaveBeenCalledWith(
      expect.objectContaining({ id: "t_rake", active: false }),
      "staff"
    );
  });

  it("says so when the product was deleted meanwhile", async () => {
    store.updateProduct.mockResolvedValue(false);

    await expect(saveProduct("update", {}, productForm())).resolves.toEqual({
      errors: { form: "This product no longer exists." },
    });
  });
});

describe("removeProduct", () => {
  beforeEach(() => supabaseDouble.givenUser("staff", { role: "admin" }));

  it("refuses to delete a product the planner or a guide needs", async () => {
    const result = await removeProduct("p_trellis");

    expect(result).toMatchObject({ ok: false });
    expect(store.deleteProduct).not.toHaveBeenCalled();
  });

  it("deletes and records an unprotected product", async () => {
    await expect(removeProduct("t_rake")).resolves.toEqual({ ok: true });

    expect(store.deleteProduct).toHaveBeenCalledWith("t_rake");
    expect(cache.updateTag).toHaveBeenCalledWith("catalog");
    expect(supabaseDouble.auditRows).toEqual([
      expect.objectContaining({ action: "product.deleted", target: "t_rake" }),
    ]);
  });
});

describe("uploadProductImage", () => {
  beforeEach(() => supabaseDouble.givenUser("staff", { role: "admin" }));

  it("stores a checked photo with its real type", async () => {
    await uploadProductImage("t_rake", null, imageForm(JPEG));

    expect(store.replaceProductImage).toHaveBeenCalledWith(
      "t_rake",
      expect.any(Uint8Array),
      "image/jpeg",
      "jpg",
      "staff"
    );
  });

  it("refuses a file that is not a photo", async () => {
    const result = await uploadProductImage("t_rake", null, imageForm([0x3c, 0x73, 0x76, 0x67]));

    expect(result).toEqual({ ok: false, error: "Use a JPEG, PNG or WebP photo." });
    expect(store.replaceProductImage).not.toHaveBeenCalled();
  });

  it("refuses a photo for a product that no longer exists", async () => {
    store.getAdminProduct.mockResolvedValue(null);

    await expect(uploadProductImage("t_rake", null, imageForm(JPEG))).resolves.toEqual({
      ok: false,
      error: "This product no longer exists.",
    });
  });
});
