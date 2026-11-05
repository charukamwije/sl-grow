import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import PlantationDashboard from "@/components/plantation/manage/PlantationDashboard";
import { getPlantation, loadRecords } from "@/lib/plantation-server";
import { getServerUser } from "@/lib/supabase/auth-server";

export const metadata: Metadata = {
  title: "Plantation",
  robots: { index: false },
};

export default async function PlantationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getServerUser();
  if (!user) redirect("/plantation/manage");

  // Someone else's plantation is a 404, the same as one that does not exist
  const plantation = await getPlantation(user.uid, (await params).id);
  if (!plantation) notFound();

  const records = await loadRecords(user.uid, plantation.id);

  return <PlantationDashboard plantation={plantation} records={records} />;
}
