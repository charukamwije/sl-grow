// Fails the build if this module is ever pulled into a client bundle
import "server-only";
import type { Timestamp } from "firebase-admin/firestore";
import { userOrders, userPlans } from "./store";

// `createdAt` is an ISO string, not a Firestore `Timestamp` - a `Timestamp`
// cannot cross the server/client component boundary.
export type OrderSummary = {
  id: string;
  createdAt: string;
  method: string;
  items: { code: string; name: string; qty: number; lineTotal: number }[];
  total: number;
};

export type PlanSummary = {
  id: string;
  createdAt: string;
  people: number;
  space: number;
  total: number;
};

// The routes under app/api are these collections' only writers and always
// set every field read here, so the casts lean on them.
function createdAt(value: unknown): string {
  return (value as Timestamp).toDate().toISOString();
}

/** FR-A-06: the customer's own orders, newest first */
export async function loadOrders(uid: string): Promise<OrderSummary[]> {
  const snapshot = await userOrders(uid).orderBy("createdAt", "desc").get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    createdAt: createdAt(doc.get("createdAt")),
    method: doc.get("method") as string,
    items: doc.get("items") as OrderSummary["items"],
    total: doc.get("total") as number,
  }));
}

/** FR-A-08: the customer's saved plans, newest first */
export async function loadPlans(uid: string): Promise<PlanSummary[]> {
  const snapshot = await userPlans(uid).orderBy("createdAt", "desc").get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    createdAt: createdAt(doc.get("createdAt")),
    people: doc.get("people") as number,
    space: doc.get("space") as number,
    total: doc.get("total") as number,
  }));
}
