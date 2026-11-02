import type { Metadata } from "next";
import AccountView, { type AccountState } from "@/components/account/AccountView";
import {
  loadOrders,
  loadPlans,
  type OrderSummary,
  type PlanSummary,
} from "@/lib/firebase/account";
import { getServerUser } from "@/lib/firebase/auth-server";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { isTransientFirestoreError } from "@/lib/firebase/store";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false },
};

export default async function AccountPage() {
  if (!isFirebaseConfigured()) {
    return <AccountView state={{ kind: "disabled" }} />;
  }

  const user = await getServerUser();
  if (!user) {
    return <AccountView state={{ kind: "signedOut" }} />;
  }

  let orders: OrderSummary[];
  let plans: PlanSummary[];

  try {
    [orders, plans] = await Promise.all([
      loadOrders(user.uid),
      loadPlans(user.uid),
    ]);
  } catch (error) {
    // An allow-list, not a deny-list: everything outside it - an
    // unprovisioned database, a broken service account - is a configuration
    // fault that has to surface, not sit behind a message that never changes.
    if (!isTransientFirestoreError(error)) throw error;

    console.error("Failed to load account data:", error);
    return <AccountView state={{ kind: "unavailable", user }} />;
  }

  const state: AccountState = { kind: "signedIn", user, orders, plans };
  return <AccountView state={state} />;
}
