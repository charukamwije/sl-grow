import { VEGETABLES } from "../data/vegetables";
import type { Catalog } from "../products";
import { computePlan, toAmount, type PlannerInputs, type VegInput } from "./calc";

const MAX_PEOPLE = 100;
const MAX_SPACE = 100_000;
const MAX_VALUE = 1_000_000;

/**
 * Planner inputs from an untrusted source (a request body, a stored row):
 * only known vegetables, with numbers clamped to sane ranges. Null when it is
 * not shaped like inputs at all.
 */
export function readInputs(value: unknown): PlannerInputs | null {
  const raw = value as { people?: unknown; space?: unknown; veg?: unknown } | null;
  if (!raw || typeof raw.veg !== "object" || raw.veg === null) return null;

  const veg: Record<string, VegInput> = {};
  for (const { id } of VEGETABLES) {
    const input = (raw.veg as Record<string, Partial<VegInput> | undefined>)[id];
    if (!input) continue;
    veg[id] = {
      selected: input.selected === true,
      price: Math.min(toAmount(input.price), MAX_VALUE),
      gramsPerWeek: Math.min(toAmount(input.gramsPerWeek), MAX_VALUE),
    };
  }

  return {
    people: Math.min(Math.floor(toAmount(raw.people)), MAX_PEOPLE),
    space: Math.min(toAmount(raw.space), MAX_SPACE),
    veg,
  };
}

/** A plan worth saving has at least one vegetable ticked */
export function hasSelection(inputs: PlannerInputs): boolean {
  return Object.values(inputs.veg).some((input) => input.selected);
}

/**
 * The row stored for a plan, recomputed from its inputs so the totals always
 * match the calculation rather than whatever a client sent.
 */
export function planRecord(inputs: PlannerInputs, catalog: Catalog) {
  const plan = computePlan(inputs, catalog);

  return {
    people: inputs.people,
    space: inputs.space,
    vegetables: inputs.veg,
    plants: Object.fromEntries(plan.rows.map((row) => [row.veg.id, row.plants])),
    shopping: plan.shopping,
    total: plan.shoppingTotal,
    yearly_savings: plan.savings.yearly,
  };
}
