import { describe, expect, it } from "vitest";
import { orderFiltersQuery, parseOrderFilters } from "@/lib/order-filters";

describe("parseOrderFilters", () => {
  it("reads a search, a date range and a page", () => {
    expect(
      parseOrderFilters({ q: " ASW-7K3P9Q ", from: "2026-11-01", to: "2026-11-04", page: "3" })
    ).toEqual({
      q: "ASW-7K3P9Q",
      from: "2026-11-01",
      to: "2026-11-04",
      status: null,
      payment: null,
      page: 3,
    });
  });

  it("starts on page 1 with nothing filtered", () => {
    expect(parseOrderFilters({})).toEqual({
      q: "",
      from: null,
      to: null,
      status: null,
      payment: null,
      page: 1,
    });
  });

  it("keeps phone numbers and Sinhala or Tamil names", () => {
    expect(parseOrderFilters({ q: "+94 77 123" }).q).toBe("+94 77 123");
    expect(parseOrderFilters({ q: "නිමල්" }).q).toBe("නිමල්");
    expect(parseOrderFilters({ q: "குமார்" }).q).toBe("குமார்");
  });

  it("drops the characters that would change a PostgREST filter", () => {
    expect(parseOrderFilters({ q: "a,ref.eq.x),(*" }).q).toBe("arefeqx");
  });

  it.each(["2026-13-01", "2026-02-30", "yesterday", "2026-1-1"])(
    "ignores the date %s",
    (value) => {
      expect(parseOrderFilters({ from: value }).from).toBeNull();
    }
  );

  it.each(["0", "-2", "1.5", "x"])("falls back to page 1 for %s", (page) => {
    expect(parseOrderFilters({ page }).page).toBe(1);
  });

  it("reads a status and a payment filter", () => {
    expect(parseOrderFilters({ status: "out_for_delivery", payment: "receipt" })).toMatchObject({
      status: "out_for_delivery",
      payment: "receipt",
    });
  });

  it("ignores an unknown status or payment filter", () => {
    expect(parseOrderFilters({ status: "shipped", payment: "maybe" })).toMatchObject({
      status: null,
      payment: null,
    });
  });

  it("takes only the first of repeated parameters", () => {
    expect(parseOrderFilters({ q: ["a", "b"] }).q).toBe("");
  });
});

describe("orderFiltersQuery", () => {
  it("keeps the filters when moving between pages", () => {
    const filters = parseOrderFilters({ q: "ASW", from: "2026-11-01" });

    expect(orderFiltersQuery(filters, 2)).toBe("?q=ASW&from=2026-11-01&page=2");
    expect(orderFiltersQuery(filters, 1)).toBe("?q=ASW&from=2026-11-01");
    expect(orderFiltersQuery(parseOrderFilters({ status: "created", payment: "unpaid" }), 1)).toBe(
      "?status=created&payment=unpaid"
    );
  });

  it("is empty with no filters on the first page", () => {
    expect(orderFiltersQuery(parseOrderFilters({}), 1)).toBe("");
  });
});
