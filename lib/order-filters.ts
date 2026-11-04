import { isOrderStatus, type OrderStatus } from "./order/checkout";

/** What the admin orders page can be filtered by, from its query string */
export type OrderFilters = {
  /** Reference, phone or name; only letters (with their vowel signs), digits,
   *  spaces, + and - survive */
  q: string;
  /** YYYY-MM-DD, UTC, inclusive */
  from: string | null;
  to: string | null;
  status: OrderStatus | null;
  /** "receipt": bank transfers with a slip waiting to be checked */
  payment: "paid" | "unpaid" | "receipt" | null;
  page: number;
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function one(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

/**
 * Search text for a PostgREST `or` filter, where commas, dots, parentheses
 * and `*` have meaning: anything beyond what a reference, phone number or
 * name needs (letters with their vowel signs, digits, spaces, + and -) is
 * dropped rather than escaped.
 */
export function cleanSearch(value: string): string {
  return value
    .replace(/[^\p{L}\p{M}\p{N} +\-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

function date(value: string): string | null {
  if (!DATE.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value
    ? null
    : value;
}

/**
 * Reads the filters. The search text goes into a PostgREST `or` filter, where
 * commas, dots, parentheses and `*` have meaning, so anything beyond what a
 * reference, phone number or name needs is dropped rather than escaped.
 */
export function parseOrderFilters(
  params: Record<string, string | string[] | undefined>
): OrderFilters {
  const q = cleanSearch(one(params.q));

  const page = Number(one(params.page));
  const status = one(params.status);
  const payment = one(params.payment);

  return {
    q,
    from: date(one(params.from)),
    to: date(one(params.to)),
    status: isOrderStatus(status) ? status : null,
    payment: payment === "paid" || payment === "unpaid" || payment === "receipt" ? payment : null,
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

/** The query string for the same filters on another page */
export function orderFiltersQuery(filters: OrderFilters, page: number): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.status) params.set("status", filters.status);
  if (filters.payment) params.set("payment", filters.payment);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `?${query}` : "";
}
