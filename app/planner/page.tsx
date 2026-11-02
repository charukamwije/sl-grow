import type { Metadata } from "next";
import PlannerWizard from "@/components/planner/PlannerWizard";

export const metadata: Metadata = {
  title: "Garden planner",
  description:
    "Work out what to grow in your space, what it costs and what your household saves.",
};

export default function PlannerPage() {
  return <PlannerWizard />;
}
