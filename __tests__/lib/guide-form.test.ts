import { describe, expect, it } from "vitest";
import { GUIDES } from "@/lib/data/guides";
import { MAX_STEPS, parseGuideInput } from "@/lib/guide-form";
import { guideIdsByVeg, productIdsInGuide, summarizeGuides } from "@/lib/guides";
import { PLANNER_PRODUCT_IDS, protectedProductIds } from "@/lib/protected-products";

const step = (en = "Water [[t_can]] every morning.") => ({
  icon: "💧",
  title: { en: "Water", si: "", ta: "" },
  text: { en, si: "", ta: "" },
});

const VALID = {
  name: { en: "Balcony herbs", si: "", ta: "" },
  icon: "🌿",
  time: null,
  steps: [step()],
  products: ["t_can", "f_compost"],
  active: true,
};

describe("parseGuideInput", () => {
  it("reads a complete guide", () => {
    expect(parseGuideInput(VALID)).toEqual({ input: VALID });
  });

  it("accepts every built-in guide as written", () => {
    for (const guide of GUIDES) {
      const result = parseGuideInput({ ...guide, time: guide.time ?? null, active: true });
      expect(result.errors, guide.id).toBeUndefined();
    }
  });

  it("trims text and fills a missing language with empty text", () => {
    const { input } = parseGuideInput({ ...VALID, name: { en: "  Herbs  " } });

    expect(input?.name).toEqual({ en: "Herbs", si: "", ta: "" });
  });

  it("drops a readiness time with no English", () => {
    expect(parseGuideInput({ ...VALID, time: { en: "", si: "", ta: "" } }).input?.time).toBeNull();
  });

  it.each([
    ["no English name", { name: { en: "", si: "x", ta: "" } }, "name"],
    ["no emoji", { icon: "" }, "icon"],
    ["no steps", { steps: [] }, "stepsList"],
    ["too many steps", { steps: Array.from({ length: MAX_STEPS + 1 }, () => step()) }, "stepsList"],
    ["a step without English text", { steps: [step(""), step()] }, "steps"],
    ["a product twice", { products: ["t_can", "t_can"] }, "products"],
    ["a malformed product ID", { products: ["DROP TABLE"] }, "products"],
  ])("refuses %s", (_, patch, key) => {
    expect(parseGuideInput({ ...VALID, ...patch }).errors).toHaveProperty(key);
  });

  it("points at the step that needs fixing", () => {
    const { errors } = parseGuideInput({ ...VALID, steps: [step(), step("")] });

    expect(Object.keys(errors!.steps!)).toEqual(["1"]);
  });

  it("refuses something that is not a guide at all", () => {
    expect(parseGuideInput("nope").errors).toBeDefined();
    expect(parseGuideInput(null).errors).toBeDefined();
  });

  it("keeps a guide on show unless told otherwise", () => {
    const { active, ...rest } = VALID;
    void active;

    expect(parseGuideInput(rest).input?.active).toBe(true);
    expect(parseGuideInput({ ...VALID, active: false }).input?.active).toBe(false);
  });
});

describe("guide helpers", () => {
  it("collects products from the list and from [[id]] in any language", () => {
    const ids = productIdsInGuide({
      products: ["f_compost"],
      steps: [
        { icon: "1", title: { en: "", si: "[[c_neem]]", ta: "" }, text: { en: "Use [[t_can]].", si: "", ta: "[[p_tie]]" } },
      ],
    });

    expect([...ids].sort()).toEqual(["c_neem", "f_compost", "p_tie", "t_can"]);
  });

  it("summarises guides without their steps", () => {
    const [summary] = summarizeGuides([GUIDES[0]]);

    expect(summary).not.toHaveProperty("steps");
    expect(summary.stepCount).toBe(GUIDES[0].steps.length);
  });

  it("maps each vegetable to its guide", () => {
    expect(guideIdsByVeg(GUIDES).tomato).toBe("tomato");
  });

  it("protects what the planner needs plus what the given guides name", () => {
    const ids = protectedProductIds([{ products: ["t_fork"], steps: [] }]);

    expect(ids.has("t_fork")).toBe(true);
    for (const id of PLANNER_PRODUCT_IDS) expect(ids.has(id)).toBe(true);
    expect(protectedProductIds([]).has("t_fork")).toBe(false);
  });
});
