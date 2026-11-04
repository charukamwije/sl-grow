import { describe, expect, it } from "vitest";
import { STATIC_CATALOG } from "@/lib/products";
import {
  computePlan,
  containerFor,
  defaultInputs,
  toAmount,
  type PlannerInputs,
} from "@/lib/planner/calc";

function onlyTomato(overrides: Partial<PlannerInputs> = {}): PlannerInputs {
  const inputs = defaultInputs();
  for (const [id, veg] of Object.entries(inputs.veg)) {
    veg.selected = id === "tomato";
  }
  return { ...inputs, people: 1, space: 2, ...overrides };
}

describe("toAmount (FR-P-07)", () => {
  it.each([
    ["", 0],
    ["abc", 0],
    [-5, 0],
    [NaN, 0],
    [undefined, 0],
    ["12.5", 12.5],
    [3, 3],
  ])("turns %p into %p", (input, expected) => {
    expect(toAmount(input)).toBe(expected);
  });
});

describe("containerFor (BR-15)", () => {
  it.each([
    [4, "k_gb15"],
    [2, "k_gb15"],
    [1.5, "k_pot12"],
    [1, "k_pot12"],
    [0.5, "k_pot8"],
  ])("puts a %p sq ft plant in %s", (space, container) => {
    expect(containerFor(space)).toBe(container);
  });
});

describe("computePlan with a single vegetable", () => {
  // 1 person eating 150 g of tomato a week, 2 sq ft: worked by hand
  const plan = computePlan(onlyTomato(), STATIC_CATALOG);
  const [row] = plan.rows;

  it("works out consumption and market cost (BR-01, BR-02)", () => {
    expect(row.annualNeedKg).toBeCloseTo(7.8);
    expect(row.weeklyKg).toBeCloseTo(0.15);
    expect(row.monthlyCost).toBeCloseTo((7.8 * 400) / 12);
    expect(plan.totals.yearlyCost).toBeCloseTo(3120);
  });

  it("works out plants needed and fits what the space allows (BR-03 to BR-08)", () => {
    expect(row.yieldPerPlantYear).toBe(6);
    expect(row.plantsNeeded).toBe(2);
    expect(row.spaceNeeded).toBe(4);
    expect(row.plants).toBe(1);
    expect(row.coverage).toBeCloseTo(6 / 7.8);
  });

  it("builds the shopping list at shop prices (FR-P-15, FR-P-16)", () => {
    expect(plan.shopping).toEqual([
      { productId: "s_tomato", qty: 1 },
      { productId: "k_gb15", qty: 1 },
      { productId: "f_compost", qty: 1 },
      { productId: "f_organic", qty: 2 },
      { productId: "c_neem", qty: 1 },
      { productId: "t_can", qty: 1 },
      { productId: "t_shears", qty: 1 },
    ]);
    // 80 seedling + 250 bag + 650 + 600 + 650 + 750 + 950 supplies
    expect(plan.shoppingTotal).toBe(3930);
  });

  it("works out the savings (BR-09 to BR-14)", () => {
    expect(plan.savings.coveredValue).toBeCloseTo(2400);
    expect(plan.savings.seedlingCost).toBe(160); // 1 plant x 80 x 2 cycles
    expect(plan.savings.runningCost).toBeCloseTo(400); // 160 + 10% of 2400
    expect(plan.savings.setupCost).toBe(3850); // everything but the seedling
    expect(plan.savings.yearly).toBeCloseTo(2400 - 400 - 3850 / 3);
    // 3850 / (2000 / 12) = 23.1, rounded up
    expect(plan.savings.paybackMonths).toBe(24);
  });

  it("works out the health figures (BR-18)", () => {
    expect(plan.health.dailyGramsPerPerson).toBeCloseTo(150 / 7);
    expect(plan.health.yearlyHarvestKg).toBeCloseTo(6);
  });
});

describe("computePlan with the default inputs (AC-01)", () => {
  const plan = computePlan(defaultInputs(), STATIC_CATALOG);

  it("allocates space by value per sq ft, highest first (BR-06, BR-07)", () => {
    expect(plan.rows.map((row) => row.veg.id)).toEqual([
      "kankun",
      "gotukola",
      "longbean",
      "tomato",
      "capsicum",
      "cucumber",
      "chili",
      "bittergourd",
      "snakegourd",
      "brinjal",
      "okra",
    ]);
  });

  it("plants in that order until the 60 sq ft run out", () => {
    const plants = Object.fromEntries(
      plan.rows.map((row) => [row.veg.id, row.plants])
    );

    expect(plants).toEqual({
      kankun: 9,
      gotukola: 9,
      longbean: 7,
      tomato: 6,
      capsicum: 6,
      cucumber: 3,
      chili: 7,
      bittergourd: 1, // only 3.5 sq ft left, and it needs 3
      snakegourd: 0,
      brinjal: 0,
      okra: 0,
    });
    expect(plan.totals.spaceUsed).toBe(59.5);
  });

  it("adds a trellis for the climbers and one container per plant (BR-15, BR-16)", () => {
    const qty = Object.fromEntries(
      plan.shopping.map((line) => [line.productId, line.qty])
    );

    expect(qty.p_trellis).toBe(1);
    expect(qty.k_pot8).toBe(18);
    expect(qty.k_pot12).toBe(20);
    expect(qty.k_gb15).toBe(10);
    // 18 x 180 + 20 x 300 + 10 x 250 + 650 trellis + 3600 supplies
    expect(plan.savings.setupCost).toBe(15990);
  });

  it("reports the space full coverage would need (FR-P-13)", () => {
    const expected = plan.rows.reduce(
      (sum, row) => sum + row.plantsNeeded * row.veg.spacePerPlant,
      0
    );
    expect(plan.totals.spaceNeeded).toBe(expected);
    expect(plan.totals.spaceNeeded).toBeGreaterThan(60);
  });
});

describe("computePlan with no usable space (AC-02)", () => {
  const plan = computePlan({ ...defaultInputs(), space: 0 }, STATIC_CATALOG);

  it("plants nothing and leaves the shopping list empty", () => {
    expect(plan.totals.plants).toBe(0);
    expect(plan.shopping).toEqual([]);
    expect(plan.savings.setupCost).toBe(0);
    expect(plan.savings.paybackMonths).toBeNull();
  });

  it("still shows consumption and market cost", () => {
    expect(plan.totals.weeklyKg).toBeGreaterThan(0);
    expect(plan.totals.yearlyCost).toBeGreaterThan(0);
  });
});

describe("computePlan with invalid inputs (FR-P-07)", () => {
  it("treats them as 0 without throwing", () => {
    const inputs = onlyTomato({
      people: Number.NaN,
      space: -10,
    });
    inputs.veg.tomato.price = Number.NaN;

    const plan = computePlan(inputs, STATIC_CATALOG);

    expect(plan.rows[0].annualNeedKg).toBe(0);
    expect(plan.totals.plants).toBe(0);
    expect(plan.savings.paybackMonths).toBeNull();
  });
});
