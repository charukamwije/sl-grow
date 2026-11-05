import type { Metadata } from "next";
import PlantationNav from "@/components/plantation/PlantationNav";
import PlantationList from "@/components/plantation/manage/PlantationList";
import SignInToManage from "@/components/plantation/manage/SignInToManage";
import { eyebrow, heading, muted } from "@/components/ui/styles";
import { listPlantations, loadYearTotals } from "@/lib/plantation-server";
import { summarize } from "@/lib/plantation/records";
import { getServerUser } from "@/lib/supabase/auth-server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "My plantations",
  robots: { index: false },
};

export default async function ManagePlantationsPage() {
  const user = isSupabaseConfigured() ? await getServerUser() : null;

  const header = (
    <header className="space-y-3">
      <PlantationNav current="manage" />
      <p className={eyebrow}>Plantation manager</p>
      <h1 className={heading}>My plantations</h1>
      <p className={`${muted} max-w-2xl`}>
        Keep the records of your tea or cinnamon land in one place: harvests, money in and
        out, field work and workers.
      </p>
    </header>
  );

  if (!user) {
    return (
      <div className="space-y-6">
        {header}
        <SignInToManage />
      </div>
    );
  }

  const year = new Date().getFullYear();
  const [plantations, totals] = await Promise.all([
    listPlantations(user.uid),
    loadYearTotals(user.uid, year),
  ]);

  // Each plantation's share of this year's records
  const mine = <T extends { id: string }>(rows: T[], id: string) =>
    rows.filter((row) => totals.plantationOf.get(row.id) === id);
  const withSummary = plantations.map((plantation) => ({
    ...plantation,
    summary: summarize(
      {
        harvests: mine(totals.harvests, plantation.id),
        transactions: mine(totals.transactions, plantation.id),
        workDays: mine(totals.workDays, plantation.id),
      },
      year
    ),
  }));

  return (
    <div className="space-y-6">
      {header}
      <PlantationList plantations={withSummary} year={year} />
    </div>
  );
}
