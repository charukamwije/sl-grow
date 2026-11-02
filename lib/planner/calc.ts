/**
 * The garden planner's calculations, SRS section 7 BR-01 to BR-18. Pure
 * functions with no UI or storage, so the same numbers back the results
 * screen, a saved plan and the tests.
 */
import {
  CONTAINER_LARGE,
  CONTAINER_MEDIUM,
  CONTAINER_SMALL,
  SHARED_SUPPLIES,
  TRELLIS,
} from "../data/products";
import { VEGETABLES, type Vegetable } from "../data/vegetables";
import { getProduct, lineTotal, seedlingFor } from "../products";

export type VegInput = {
  selected: boolean;
  /** LKR per kg */
  price: number;
  /** Grams per person per week */
  gramsPerWeek: number;
};

export type PlannerInputs = {
  people: number;
  space: number;
  veg: Record<string, VegInput>;
};

export type PlanRow = {
  veg: Vegetable;
  price: number;
  gramsPerWeek: number;
  annualNeedKg: number;
  weeklyKg: number;
  monthlyCost: number;
  yieldPerPlantYear: number;
  plantsNeeded: number;
  spaceNeeded: number;
  valuePerSqft: number;
  plants: number;
  spaceUsed: number;
  containerId: string;
  coverage: number;
  coveredKg: number;
};

export type ShoppingLine = { productId: string; qty: number };

export type PlanResult = {
  rows: PlanRow[];
  totals: {
    weeklyKg: number;
    monthlyCost: number;
    yearlyCost: number;
    spaceNeeded: number;
    spaceUsed: number;
    plants: number;
  };
  shopping: ShoppingLine[];
  shoppingTotal: number;
  savings: {
    coveredValue: number;
    seedlingCost: number;
    runningCost: number;
    setupCost: number;
    yearly: number;
    monthly: number;
    /** Null when the garden never pays back its setup (BR-14) */
    paybackMonths: number | null;
  };
  health: {
    dailyGramsPerPerson: number;
    yearlyHarvestKg: number;
  };
};

/** FR-P-07: empty, negative or invalid numbers count as 0 */
export function toAmount(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export const SETUP_LIFE_YEARS = 3; // BR-13
export const RUNNING_ALLOWANCE = 0.1; // BR-11: fertilizer and water

export function defaultInputs(): PlannerInputs {
  return {
    people: 4,
    space: 60,
    veg: Object.fromEntries(
      VEGETABLES.map((veg) => [
        veg.id,
        { selected: true, price: veg.price, gramsPerWeek: veg.gramsPerWeek },
      ])
    ),
  };
}

/** BR-15 */
export function containerFor(spacePerPlant: number): string {
  if (spacePerPlant >= 2) return CONTAINER_LARGE;
  if (spacePerPlant >= 1) return CONTAINER_MEDIUM;
  return CONTAINER_SMALL;
}

export function computePlan(inputs: PlannerInputs): PlanResult {
  const people = Math.floor(toAmount(inputs.people));
  let remaining = toAmount(inputs.space);

  const rows: PlanRow[] = VEGETABLES.filter(
    (veg) => inputs.veg[veg.id]?.selected
  ).map((veg) => {
    const input = inputs.veg[veg.id];
    const price = toAmount(input.price);
    const gramsPerWeek = toAmount(input.gramsPerWeek);
    const annualNeedKg = (gramsPerWeek / 1000) * people * 52; // BR-01
    const yieldPerPlantYear = veg.yieldPerCycle * veg.cyclesPerYear; // BR-03
    const plantsNeeded =
      yieldPerPlantYear > 0 ? Math.ceil(annualNeedKg / yieldPerPlantYear) : 0; // BR-04

    return {
      veg,
      price,
      gramsPerWeek,
      annualNeedKg,
      weeklyKg: annualNeedKg / 52, // BR-02
      monthlyCost: (annualNeedKg * price) / 12,
      yieldPerPlantYear,
      plantsNeeded,
      spaceNeeded: plantsNeeded * veg.spacePerPlant, // BR-05
      valuePerSqft: (price * yieldPerPlantYear) / veg.spacePerPlant, // BR-06
      plants: 0,
      spaceUsed: 0,
      containerId: containerFor(veg.spacePerPlant),
      coverage: 0,
      coveredKg: 0,
    };
  });

  // BR-07: highest value per sq ft first; `sort` is stable, so ties keep
  // the catalogue order
  rows.sort((a, b) => b.valuePerSqft - a.valuePerSqft);

  for (const row of rows) {
    row.plants = Math.min(
      row.plantsNeeded,
      Math.floor(remaining / row.veg.spacePerPlant)
    );
    row.spaceUsed = row.plants * row.veg.spacePerPlant;
    remaining -= row.spaceUsed;

    const harvest = row.plants * row.yieldPerPlantYear;
    row.coveredKg = Math.min(harvest, row.annualNeedKg);
    row.coverage = row.annualNeedKg > 0 ? row.coveredKg / row.annualNeedKg : 0; // BR-08
  }

  const planted = rows.filter((row) => row.plants > 0);

  const shopping = buildShoppingList(planted);
  const shoppingTotal = shopping.reduce(
    (sum, line) => sum + lineTotal(line.productId, line.qty),
    0
  );

  const coveredValue = sum(rows, (row) => row.coveredKg * row.price); // BR-09
  const seedlingCost = sum(
    planted,
    (row) =>
      row.plants *
      (seedlingFor(row.veg.id)?.price ?? 0) *
      row.veg.cyclesPerYear
  ); // BR-10
  const runningCost = seedlingCost + RUNNING_ALLOWANCE * coveredValue; // BR-11
  const setupCost = shopping
    .filter((line) => getProduct(line.productId)?.category !== "seedlings")
    .reduce((total, line) => total + lineTotal(line.productId, line.qty), 0); // BR-12
  const yearly = coveredValue - runningCost - setupCost / SETUP_LIFE_YEARS; // BR-13
  const monthlyNet = (coveredValue - runningCost) / 12;
  const paybackMonths =
    setupCost > 0 && monthlyNet > 0 ? Math.ceil(setupCost / monthlyNet) : null; // BR-14

  const yearlyCost = sum(rows, (row) => row.annualNeedKg * row.price);

  return {
    rows,
    totals: {
      weeklyKg: sum(rows, (row) => row.weeklyKg),
      monthlyCost: yearlyCost / 12,
      yearlyCost,
      spaceNeeded: sum(rows, (row) => row.spaceNeeded), // FR-P-13
      spaceUsed: sum(rows, (row) => row.spaceUsed),
      plants: sum(rows, (row) => row.plants),
    },
    shopping,
    shoppingTotal,
    savings: {
      coveredValue,
      seedlingCost,
      runningCost,
      setupCost,
      yearly,
      monthly: yearly / 12,
      paybackMonths,
    },
    health: {
      dailyGramsPerPerson: sum(rows, (row) => row.gramsPerWeek) / 7, // BR-18
      yearlyHarvestKg: sum(rows, (row) => row.coveredKg),
    },
  };
}

/** FR-P-15, BR-15, BR-16: empty when nothing could be planted */
function buildShoppingList(planted: PlanRow[]): ShoppingLine[] {
  if (planted.length === 0) {
    return [];
  }

  const lines: ShoppingLine[] = [];
  const add = (productId: string, qty: number) => {
    const existing = lines.find((line) => line.productId === productId);
    if (existing) existing.qty += qty;
    else lines.push({ productId, qty });
  };

  for (const row of planted) {
    const seedling = seedlingFor(row.veg.id);
    if (seedling) add(seedling.id, row.plants);
  }
  for (const row of planted) {
    add(row.containerId, row.plants);
  }
  if (planted.some((row) => row.veg.climbing)) {
    add(TRELLIS, 1);
  }
  for (const supply of SHARED_SUPPLIES) {
    add(supply.productId, supply.qty);
  }

  return lines;
}

function sum<T>(items: T[], pick: (item: T) => number): number {
  return items.reduce((total, item) => total + pick(item), 0);
}
