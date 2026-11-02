import { describe, expect, it } from "vitest";
import { GUIDES } from "@/lib/data/guides";
import { CATEGORIES, PRODUCTS, SHARED_SUPPLIES } from "@/lib/data/products";
import { VEGETABLES } from "@/lib/data/vegetables";
import { STRINGS } from "@/lib/i18n/strings";
import {
  cartTotal,
  getProduct,
  lineTotal,
  mergeCarts,
  productCode,
  sanitizeCart,
  seedlingFor,
} from "@/lib/products";

describe("productCode (BR-19, Appendix A)", () => {
  it.each([
    ["s_tomato", "S-TOMATO"],
    ["f_compost", "F-COMPOST"],
    ["k_gb15", "K-GB15"],
    ["t_ph", "T-PH"],
    ["c_neem", "C-NEEM"],
    ["a_b_c", "A-B_C"],
  ])("%s → %s", (id, code) => {
    expect(productCode(id)).toBe(code);
  });
});

describe("cart totals (BR-17)", () => {
  it("multiplies the shop price by the quantity", () => {
    expect(lineTotal("s_tomato", 3)).toBe(240);
    expect(cartTotal({ s_tomato: 3, f_compost: 1 })).toBe(890);
    expect(cartTotal({})).toBe(0);
  });
});

describe("sanitizeCart", () => {
  it("keeps only known products with positive whole quantities", () => {
    expect(
      sanitizeCart({
        s_tomato: 2,
        unknown: 1,
        t_ph: 0,
        c_neem: -1,
        k_gb15: 1.5,
        f_compost: "2",
        t_can: 5000,
      })
    ).toEqual({ s_tomato: 2 });
  });

  it.each([null, undefined, "x", 3, ["s_tomato"]])("returns {} for %p", (value) => {
    expect(sanitizeCart(value)).toEqual({});
  });
});

describe("mergeCarts (BR-20)", () => {
  it("keeps the larger quantity of each product", () => {
    expect(
      mergeCarts({ s_tomato: 2, k_gb15: 4 }, { s_tomato: 5, t_ph: 1 })
    ).toEqual({ s_tomato: 5, k_gb15: 4, t_ph: 1 });
  });
});

describe("the catalogue (SRS 4.1 to 4.4)", () => {
  it("has about 50 products, unique IDs and only known categories", () => {
    expect(PRODUCTS.length).toBeGreaterThanOrEqual(45);
    expect(new Set(PRODUCTS.map((p) => p.id)).size).toBe(PRODUCTS.length);
    for (const product of PRODUCTS) {
      expect(CATEGORIES).toContain(product.category);
      expect(product.price).toBeGreaterThan(0);
      expect(`unit.${product.unit}` in STRINGS).toBe(true);
    }
  });

  it("has a seedling and a guide for each of the 11 vegetables", () => {
    expect(VEGETABLES).toHaveLength(11);
    for (const veg of VEGETABLES) {
      expect(seedlingFor(veg.id)).toBeDefined();
      expect(GUIDES.some((guide) => guide.vegId === veg.id)).toBe(true);
    }
  });

  it("has every product a guide, step or supply list mentions (FR-G-05, FR-G-06)", () => {
    const mentioned = new Set(SHARED_SUPPLIES.map((s) => s.productId));
    for (const guide of GUIDES) {
      guide.products.forEach((id) => mentioned.add(id));
      for (const step of guide.steps) {
        for (const text of [...Object.values(step.title), ...Object.values(step.text)]) {
          for (const [, id] of text.matchAll(/\[\[(\w+)\]\]/g)) mentioned.add(id);
        }
      }
    }
    for (const id of mentioned) {
      expect(getProduct(id), id).toBeDefined();
    }
  });

  it("has the guide step counts the SRS asks for (FR-G-02, AC-09)", () => {
    const steps = (id: string) => GUIDES.find((g) => g.id === id)!.steps.length;

    expect(steps("package")).toBe(7);
    expect(steps("soil")).toBe(10);
    expect(steps("tomato")).toBe(9);
    for (const guide of GUIDES.filter((g) => g.kind === "vegetable")) {
      expect(guide.steps.length).toBeGreaterThanOrEqual(6);
      expect(guide.steps.length).toBeLessThanOrEqual(10);
    }
  });

  it("has every text in all three languages (FR-L-02)", () => {
    const texts = [
      ...Object.values(STRINGS),
      ...PRODUCTS.map((p) => p.name),
      ...VEGETABLES.flatMap((v) => [v.name, v.health]),
      ...GUIDES.flatMap((g) => [g.name, ...g.steps.flatMap((s) => [s.title, s.text])]),
    ];
    for (const text of texts) {
      expect(text.en.length).toBeGreaterThan(0);
      expect(text.si.length).toBeGreaterThan(0);
      expect(text.ta.length).toBeGreaterThan(0);
    }
  });
});
