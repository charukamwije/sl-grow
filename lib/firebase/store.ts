// Fails the build if this module is ever pulled into a client bundle
import "server-only";
import { GrpcStatus } from "firebase-admin/firestore";
import { adminDb } from "./admin";

/**
 * Everything a customer owns lives under their own user document:
 *
 *   users/{uid}/meta/cart     the cloud cart (FR-A-04)
 *   users/{uid}/orders/{id}   orders sent while signed in (FR-A-05)
 *   users/{uid}/plans/{id}    saved planner results (FR-A-08)
 *
 * These only build paths for whatever uid they are handed, so ownership
 * (FR-A-11) rests entirely on every caller passing the uid from the verified
 * session cookie, never one taken from a request body or path segment.
 * Nesting also keeps the `createdAt` ordering inside one collection, which
 * Firestore serves from its automatic single-field index, and lets account
 * deletion sweep a customer's data with one `recursiveDelete`.
 */
export function userDoc(uid: string) {
  return adminDb.collection("users").doc(uid);
}

export function userCart(uid: string) {
  return userDoc(uid).collection("meta").doc("cart");
}

export function userOrders(uid: string) {
  return userDoc(uid).collection("orders");
}

export function userPlans(uid: string) {
  return userDoc(uid).collection("plans");
}

// An allow-list, not a deny-list: `NOT_FOUND` (no database provisioned),
// `PERMISSION_DENIED` / `UNAUTHENTICATED` (a broken service account) and
// anything unrecognised are configuration or programming faults that have to
// surface, not be retried or masked as "try again later".
const transientCodes: number[] = [
  GrpcStatus.UNAVAILABLE,
  GrpcStatus.DEADLINE_EXCEEDED,
  GrpcStatus.RESOURCE_EXHAUSTED,
  GrpcStatus.INTERNAL,
];

export function isTransientFirestoreError(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;

  return typeof code === "number" && transientCodes.includes(code);
}
