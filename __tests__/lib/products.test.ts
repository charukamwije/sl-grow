import { describe, expect, it } from "vitest";
import { CERT_TRACKS } from "@/lib/data/certifications";
import { GUIDES } from "@/lib/data/guides";
import { CATEGORIES, PRODUCTS, SHARED_SUPPLIES } from "@/lib/data/products";
import { VEGETABLES } from "@/lib/data/vegetables";
import { STRINGS } from "@/lib/i18n/strings";
import {
  createCatalog,
  mergeCarts,
  productCode,
  sanitizeQuantities,
  STATIC_CATALOG,
} from "@/lib/products";
import { isProtectedProduct, PROTECTED_PRODUCT_IDS } from "@/lib/protected-products";

const { cartTotal, getProduct, lineTotal, sanitizeCart, seedlingFor } = STATIC_CATALOG;

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

describe("createCatalog", () => {
  const tomato = PRODUCTS.find((p) => p.id === "s_tomato")!;
  const catalog = createCatalog([{ ...tomato, price: 95 }]);

  it("prices from the products it was given, not the code", () => {
    expect(catalog.lineTotal("s_tomato", 2)).toBe(190);
    expect(catalog.cartTotal({ s_tomato: 1, f_compost: 1 })).toBe(95);
  });

  it("drops products it does not have from a cart, as it does hidden ones", () => {
    expect(catalog.sanitizeCart({ s_tomato: 1, f_compost: 2 })).toEqual({ s_tomato: 1 });
    expect(catalog.getProduct("f_compost")).toBeUndefined();
  });

  it("finds the seedling for a vegetable among its own products", () => {
    expect(catalog.seedlingFor("tomato")?.price).toBe(95);
    expect(catalog.seedlingFor("chili")).toBeUndefined();
  });
});

describe("sanitizeQuantities", () => {
  it("checks quantities for any product ID when not told which to keep", () => {
    expect(sanitizeQuantities({ anything: 2, other: 0, s_tomato: 1.5 })).toEqual({
      anything: 2,
    });
  });
});

describe("protected products", () => {
  it.each(["k_gb15", "k_pot12", "k_pot8", "p_trellis", "f_compost", "s_tomato", "c_fruitfly"])(
    "protects %s, which the planner or a guide needs",
    (id) => {
      expect(isProtectedProduct(id)).toBe(true);
    }
  );

  it("leaves products nothing depends on editable", () => {
    expect(isProtectedProduct("t_fork")).toBe(false);
    expect(isProtectedProduct("k_tray")).toBe(false);
  });

  it("only protects products that exist", () => {
    for (const id of PROTECTED_PRODUCT_IDS) {
      expect(getProduct(id), id).toBeDefined();
    }
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

  it("has a full course for every certification path", () => {
    for (const track of CERT_TRACKS) {
      expect(track.modules.length).toBeGreaterThanOrEqual(3);
      expect(track.requirements.length).toBeGreaterThan(0);
      expect(new Set(track.modules.map((m) => m.id)).size).toBe(track.modules.length);

      for (const mod of track.modules) {
        expect(mod.lessons.length).toBeGreaterThanOrEqual(3);
        expect(mod.quiz.length).toBeGreaterThanOrEqual(2);
        for (const lesson of mod.lessons) {
          expect(lesson.icon).toBeTruthy();
          expect(lesson.points.length).toBeGreaterThanOrEqual(2);
        }
        for (const q of mod.quiz) {
          expect(q.answer).toBeGreaterThanOrEqual(0);
          expect(q.answer).toBeLessThan(q.options.length);
        }
      }

      for (const text of [
        track.name,
        track.forWho,
        ...track.requirements,
        ...track.modules.flatMap((m) => [
          m.title,
          ...m.lessons.flatMap((lesson) => [lesson.title, ...lesson.points, lesson.task]),
          ...m.quiz.flatMap((q) => [q.question, ...q.options]),
        ]),
      ]) {
        expect(text.en && text.si && text.ta).toBeTruthy();
      }
    }
  });

  it("links course lessons only to pages that exist", () => {
    const pages = new Set(["/planner", "/plantation", "/guides", ...GUIDES.map((g) => `/guides/${g.id}`)]);
    for (const track of CERT_TRACKS) {
      for (const lesson of track.modules.flatMap((m) => m.lessons)) {
        if (lesson.href) expect(pages.has(lesson.href), lesson.href).toBe(true);
      }
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
