import type { Metadata } from "next";
import DevicePlanView from "@/components/planner/DevicePlanView";

export const metadata: Metadata = {
  title: "Saved plan",
  robots: { index: false },
};

export default async function DevicePlanPage({ params }: { params: Promise<{ id: string }> }) {
  return <DevicePlanView id={(await params).id} />;
}
