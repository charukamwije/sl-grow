import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import SavedPlanView from "@/components/planner/SavedPlanView";
import { loadOwnPlan } from "@/lib/supabase/account";
import { getServerUser } from "@/lib/supabase/auth-server";

export const metadata: Metadata = {
  title: "Saved plan",
  robots: { index: false },
};

export default async function SavedPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getServerUser();
  if (!user) redirect("/account");

  // Someone else's plan is a 404, the same as one that does not exist
  const plan = await loadOwnPlan(user.uid, (await params).id);
  if (!plan) notFound();

  return (
    <SavedPlanView
      plan={{ kind: "account", id: plan.id, createdAt: plan.createdAt, updatedAt: plan.updatedAt }}
      inputs={plan.inputs}
    />
  );
}
