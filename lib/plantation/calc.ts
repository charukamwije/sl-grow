/**
 * Plantation investment calculations, SRS section 7 "Plantation
 * calculations". Year 0 is the setup year and carries only the setup cost;
 * years 1 to N carry revenue and upkeep.
 */
import type { PlantationAssumptions } from "../data/plantation";

export type PlantationInputs = {
  hectares: number;
  /** Discount rate as a fraction, 0.12 = 12% */
  rate: number;
  years: number;
  assumptions: PlantationAssumptions;
};

export type CashFlowYear = {
  year: number;
  revenue: number;
  upkeep: number;
  setup: number;
  net: number;
  cumulative: number;
};

export type PlantationResult = {
  setupInvestment: number;
  table: CashFlowYear[];
  npv: number;
  /** Null when the cash flows never change sign */
  irr: number | null;
  /** Null when cumulative cash stays negative for the whole period */
  paybackYear: number | null;
  /** Null when nothing is ever harvested */
  breakEvenPrice: number | null;
  workers: number;
};

/** 0 before the first harvest year, 0.5 in it and 1 after it */
export function ramp(year: number, firstHarvestYear: number): number {
  if (year < firstHarvestYear) return 0;
  if (year === firstHarvestYear) return 0.5;
  return 1;
}

export function cashFlows(inputs: PlantationInputs): CashFlowYear[] {
  const { hectares, years, assumptions: a } = inputs;
  const table: CashFlowYear[] = [];
  let cumulative = 0;

  for (let year = 0; year <= years; year++) {
    const setup = year === 0 ? a.setupCost * hectares : 0;
    const revenue =
      a.yieldKg * hectares * a.price * ramp(year, a.firstHarvestYear);
    const upkeep =
      year === 0
        ? 0
        : (year < a.firstHarvestYear ? a.upkeepBefore : a.upkeepAfter) *
          hectares;
    const net = revenue - upkeep - setup;
    cumulative += net;

    table.push({ year, revenue, upkeep, setup, net, cumulative });
  }

  return table;
}

export function npv(nets: number[], rate: number): number {
  return nets.reduce((total, net, t) => total + net / (1 + rate) ** t, 0);
}

/** The rate at which NPV = 0, found by bisection */
export function irr(nets: number[]): number | null {
  let low = -0.99;
  let high = 10;
  let npvLow = npv(nets, low);

  if (npvLow * npv(nets, high) > 0) {
    return null;
  }

  for (let i = 0; i < 200; i++) {
    const mid = (low + high) / 2;
    const npvMid = npv(nets, mid);

    if (Math.abs(npvMid) < 1e-6 || high - low < 1e-9) {
      return mid;
    }
    if (npvLow * npvMid < 0) {
      high = mid;
    } else {
      low = mid;
      npvLow = npvMid;
    }
  }

  return (low + high) / 2;
}

export function computePlantation(inputs: PlantationInputs): PlantationResult {
  const { hectares, rate, assumptions: a } = inputs;
  const table = cashFlows(inputs);
  const nets = table.map((row) => row.net);
  const value = npv(nets, rate);

  // NPV is linear in price, so the price that makes NPV = 0 is the current
  // price minus NPV divided by the present value of the quantity sold
  const pvQuantity = table.reduce(
    (total, row) =>
      total +
      (a.yieldKg * hectares * ramp(row.year, a.firstHarvestYear)) /
        (1 + rate) ** row.year,
    0
  );

  return {
    setupInvestment: a.setupCost * hectares,
    table,
    npv: value,
    irr: irr(nets),
    paybackYear: table.find((row) => row.cumulative >= 0)?.year ?? null,
    breakEvenPrice: pvQuantity > 0 ? a.price - value / pvQuantity : null,
    workers: a.workersPerHa * hectares,
  };
}
