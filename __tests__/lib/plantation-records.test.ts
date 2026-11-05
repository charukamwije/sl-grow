import { describe, expect, it } from "vitest";
import {
  checkRecord,
  expectedByMonth,
  recordYears,
  summarize,
  wagesOwedByWorker,
  type PlantationRecords,
} from "@/lib/plantation/records";

describe("checkRecord", () => {
  it("accepts a plantation and stores numbers as numbers", () => {
    const result = checkRecord(
      "plantation",
      { name: " Hill estate ", crop: "tea", area: "2.5", area_unit: "ha", location: "", planted_on: "", notes: "" },
      null
    );

    expect(result).toEqual({
      ok: true,
      values: {
        name: "Hill estate",
        crop: "tea",
        area: 2.5,
        area_unit: "ha",
        area_ha: 2.5,
        location: "",
        planted_on: null,
        notes: "",
      },
    });
  });

  it("takes the area in acres and stores it in hectares too", () => {
    const result = checkRecord("plantation", { name: "Kurunduwatta", crop: "cinnamon", area: "5", area_unit: "acres" }, null);

    expect(result).toMatchObject({ ok: true, values: { area: 5, area_unit: "acres" } });
    if (result.ok) expect(result.values.area_ha).toBeCloseTo(2.0234, 4);
  });

  it("names every missing or wrong field", () => {
    const result = checkRecord("plantation", { name: "", crop: "rubber", area: "0", area_unit: "sq ft" }, null);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(["area", "area_unit", "crop", "name"]);
  });

  it("takes only the products of the plantation's crop", () => {
    const harvest = { harvested_on: "2026-03-04", product: "quills", quantity_kg: "12" };

    expect(checkRecord("harvest", harvest, "cinnamon").ok).toBe(true);
    expect(checkRecord("harvest", harvest, "tea").ok).toBe(false);
  });

  it("refuses dates that do not exist", () => {
    const result = checkRecord("activity", { done_on: "2026-02-30", type: "weeding" }, "tea");

    expect(result).toMatchObject({ ok: false, errors: { done_on: "Choose a date." } });
  });

  it("matches a money category to money in or out", () => {
    const base = { occurred_on: "2026-01-10", amount: "5000" };

    expect(checkRecord("transaction", { ...base, kind: "expense", category: "fertilizer" }, "tea").ok).toBe(true);
    expect(checkRecord("transaction", { ...base, kind: "income", category: "fertilizer" }, "tea").ok).toBe(false);
    expect(checkRecord("transaction", { ...base, kind: "income", category: "leaf_sales" }, "tea").ok).toBe(true);
  });

  it("reads ticked checkboxes and keeps kg only for plucking or cutting", () => {
    const day = { worker_id: "w1", worked_on: "2026-05-01", wage: "2500", paid: "on", kg_plucked: "18" };

    expect(checkRecord("workday", { ...day, task: "plucking" }, "tea")).toMatchObject({
      ok: true,
      values: { paid: true, kg_plucked: 18 },
    });
    expect(checkRecord("workday", { ...day, task: "weeding" }, "tea")).toMatchObject({
      ok: true,
      values: { kg_plucked: null },
    });
  });
});

const records: PlantationRecords = {
  harvests: [
    { id: "h1", harvested_on: "2026-01-15", product: "green_leaf", quantity_kg: 100, block: "", grade: "", notes: "" },
    { id: "h2", harvested_on: "2026-01-29", product: "green_leaf", quantity_kg: 50, block: "", grade: "", notes: "" },
    { id: "h3", harvested_on: "2025-12-30", product: "green_leaf", quantity_kg: 999, block: "", grade: "", notes: "" },
  ],
  transactions: [
    { id: "t1", occurred_on: "2026-02-01", kind: "income", category: "leaf_sales", amount: 30000, description: "" },
    { id: "t2", occurred_on: "2026-02-03", kind: "expense", category: "fertilizer", amount: 8000, description: "" },
  ],
  activities: [{ id: "a1", done_on: "2024-06-01", type: "pruning", block: "", notes: "" }],
  workers: [{ id: "w1", name: "Kamala", phone: "", daily_wage: 1500, active: true }],
  workDays: [
    { id: "d1", worker_id: "w1", worked_on: "2026-01-15", task: "plucking", kg_plucked: 20, wage: 1500, paid: true },
    { id: "d2", worker_id: "w1", worked_on: "2026-01-16", task: "plucking", kg_plucked: 22, wage: 1500, paid: false },
  ],
};

describe("summarize", () => {
  it("adds up one year's money, wages and harvest", () => {
    const summary = summarize(records, 2026);

    expect(summary).toMatchObject({
      income: 30000,
      expenses: 8000,
      wages: 3000,
      wagesOwed: 1500,
      profit: 19000,
      harvestKg: 150,
    });
    expect(summary.harvestByMonth[0]).toMatchObject({ month: 0, kg: 150 });
    expect(summary.harvestByProduct).toEqual([{ product: "green_leaf", kg: 150 }]);
  });

  it("compares the harvest with what the land should give", () => {
    // 1 ha of tea in full bearing: 8,000 kg green leaf a year, 7% in January
    const summary = summarize(records, 2026, { crop: "tea", area_ha: 1, planted_on: "2015-04-01" });

    expect(summary.harvestByMonth[0].comparableKg).toBe(150);
    expect(summary.harvestByMonth[0].expectedKg).toBeCloseTo(560);
  });

  it("counts made tea as the green leaf it came from, and not cinnamon leaves as bark", () => {
    const harvests = [
      { id: "m", harvested_on: "2026-02-01", product: "made_tea", quantity_kg: 10, block: "", grade: "", notes: "" },
    ];
    const tea = summarize({ ...records, harvests }, 2026, { crop: "tea", area_ha: 1, planted_on: null });
    const leaves = summarize(
      { ...records, harvests: [{ ...harvests[0], product: "leaf" }] },
      2026,
      { crop: "cinnamon", area_ha: 1, planted_on: null }
    );

    expect(tea.harvestByMonth[1].comparableKg).toBe(45);
    expect(leaves.harvestByMonth[1].comparableKg).toBe(0);
    expect(leaves.harvestKg).toBe(10);
  });

  it("expects nothing before the first harvest year and half in it", () => {
    const year = (planted: string) =>
      expectedByMonth({ crop: "cinnamon", area_ha: 1, planted_on: planted }, 2026).reduce((a, b) => a + b, 0);

    expect(year("2025-05-01")).toBe(0);
    expect(year("2023-05-01")).toBeCloseTo(300);
    expect(year("2020-05-01")).toBeCloseTo(600);
    expect(year("2027-05-01")).toBe(0);
  });

  it("leaves other years out", () => {
    expect(summarize(records, 2025).harvestKg).toBe(999);
    expect(summarize(records, 2025).income).toBe(0);
  });
});

describe("recordYears and wagesOwedByWorker", () => {
  it("lists the years with records, newest first, with the current year", () => {
    expect(recordYears(records, 2027)).toEqual([2027, 2026, 2025, 2024]);
  });

  it("totals the unpaid days of each worker", () => {
    expect(wagesOwedByWorker(records.workDays)).toEqual(new Map([["w1", 1500]]));
  });
});
