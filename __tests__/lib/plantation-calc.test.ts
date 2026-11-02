import { describe, expect, it } from "vitest";
import { CROPS } from "@/lib/data/plantation";
import {
  computePlantation,
  irr,
  npv,
  ramp,
  type PlantationInputs,
} from "@/lib/plantation/calc";

// A small case worked by hand (AC-22)
const handCase: PlantationInputs = {
  hectares: 1,
  rate: 0.1,
  years: 5,
  assumptions: {
    setupCost: 1000,
    upkeepBefore: 100,
    upkeepAfter: 200,
    yieldKg: 10,
    price: 100,
    firstHarvestYear: 2,
    workersPerHa: 2,
  },
};

describe("ramp", () => {
  it("is 0 before the first harvest, 0.5 in it and 1 after", () => {
    expect([0, 1, 2, 3, 4].map((year) => ramp(year, 2))).toEqual([
      0, 0, 0.5, 1, 1,
    ]);
  });
});

describe("computePlantation", () => {
  const result = computePlantation(handCase);

  it("builds the yearly money table", () => {
    expect(result.table.map((row) => row.net)).toEqual([
      -1000, -100, 300, 800, 800, 800,
    ]);
    expect(result.table.map((row) => row.cumulative)).toEqual([
      -1000, -1100, -800, 0, 800, 1600,
    ]);
  });

  it("finds the payback year: the first with cumulative cash of 0 or more", () => {
    expect(result.paybackYear).toBe(3);
  });

  it("discounts the cash flows to an NPV", () => {
    // -1000 - 100/1.1 + 300/1.21 + 800/1.331 + 800/1.4641 + 800/1.61051
    expect(result.npv).toBeCloseTo(801.22, 1);
  });

  it("finds the IRR, where NPV is 0", () => {
    expect(result.irr).not.toBeNull();
    expect(result.irr!).toBeGreaterThan(0.1);
    expect(npv(result.table.map((row) => row.net), result.irr!)).toBeCloseTo(0, 3);
  });

  it("finds the break-even price, where NPV is 0", () => {
    // PV of costs 1667.25 over PV of kilograms 24.6847
    expect(result.breakEvenPrice).toBeCloseTo(67.54, 1);

    const atBreakEven = computePlantation({
      ...handCase,
      assumptions: { ...handCase.assumptions, price: result.breakEvenPrice! },
    });
    expect(atBreakEven.npv).toBeCloseTo(0, 6);
  });

  it("scales setup and workers with the land", () => {
    const twice = computePlantation({ ...handCase, hectares: 2 });

    expect(result.setupInvestment).toBe(1000);
    expect(twice.setupInvestment).toBe(2000);
    expect(twice.workers).toBe(4);
    expect(twice.npv).toBeCloseTo(result.npv * 2, 6);
  });

  it("reports no payback, IRR or break-even when nothing is ever harvested", () => {
    const never = computePlantation({
      ...handCase,
      assumptions: { ...handCase.assumptions, firstHarvestYear: 10 },
    });

    expect(never.paybackYear).toBeNull();
    expect(never.irr).toBeNull();
    expect(never.breakEvenPrice).toBeNull();
  });
});

describe("irr", () => {
  it("returns null when the cash flows never change sign", () => {
    expect(irr([-100, -10, -10])).toBeNull();
  });

  it("finds a known rate", () => {
    // -100 now and 110 in a year is exactly 10%
    expect(irr([-100, 110])).toBeCloseTo(0.1, 6);
  });
});

describe("the default crops", () => {
  it.each(CROPS.map((crop) => [crop.id, crop] as const))(
    "%s produces finite figures and six growing steps",
    (_, crop) => {
      const result = computePlantation({
        hectares: 1,
        rate: 0.12,
        years: 15,
        assumptions: crop.defaults,
      });

      expect(Number.isFinite(result.npv)).toBe(true);
      expect(result.table).toHaveLength(16);
      expect(crop.steps).toHaveLength(6);
    }
  );
});
