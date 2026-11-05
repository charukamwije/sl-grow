import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import DevicePlanWizard from "@/components/planner/DevicePlanWizard";
import PlannerWizard from "@/components/planner/PlannerWizard";
import { loadOwnPlan } from "@/lib/supabase/account";
import { getServerUser } from "@/lib/supabase/auth-server";

export const metadata: Metadata = {
  title: "Garden planner",
  description:
    "Work out what to grow in your space, what it costs and what your household saves.",
};

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { plan: planId, device } = await searchParams;

  // A plan saved on this device: only the browser can read it
  if (typeof device === "string") {
    return <DevicePlanWizard id={device} />;
  }

  // A plan saved in the account, opened to change it
  if (typeof planId === "string") {
    const user = await getServerUser();
    if (!user) redirect("/account");

    const plan = await loadOwnPlan(user.uid, planId);
    if (!plan) notFound();

    return <PlannerWizard initial={plan.inputs} editing={{ kind: "account", id: plan.id }} />;
  }

  return <PlannerWizard />;
}
