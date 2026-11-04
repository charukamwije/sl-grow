import type { Metadata } from "next";
import AccountView, { type AccountState } from "@/components/account/AccountView";
import {
  loadOrders,
  loadPlans,
  type OrderSummary,
  type PlanSummary,
} from "@/lib/supabase/account";
import { listOwnApplications, type OwnApplication } from "@/lib/certifications-server";
import { getServerUser } from "@/lib/supabase/auth-server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isTransientDbError } from "@/lib/supabase/store";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false },
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const signInFailed = params.signInFailed === "1";
  const confirmDelete = params.confirmDelete === "1";

  if (!isSupabaseConfigured()) {
    return <AccountView state={{ kind: "disabled" }} />;
  }

  const user = await getServerUser();
  if (!user) {
    return (
      <AccountView state={{ kind: "signedOut" }} signInFailed={signInFailed} />
    );
  }

  let orders: OrderSummary[];
  let plans: PlanSummary[];
  let applications: OwnApplication[];

  try {
    [orders, plans, applications] = await Promise.all([
      loadOrders(user.uid),
      loadPlans(user.uid),
      listOwnApplications(user.uid),
    ]);
  } catch (error) {
    // An allow-list, not a deny-list: everything outside it - an
    // unprovisioned database, a broken service account - is a configuration
    // fault that has to surface, not sit behind a message that never changes.
    if (!isTransientDbError(error)) throw error;

    console.error("Failed to load account data:", error);
    return (
      <AccountView
        state={{ kind: "unavailable", user }}
        confirmDelete={confirmDelete}
      />
    );
  }

  const state: AccountState = { kind: "signedIn", user, orders, plans, applications };
  return <AccountView state={state} confirmDelete={confirmDelete} />;
}
