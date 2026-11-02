import type { Metadata } from "next";
import PlannerWizard from "@/components/planner/PlannerWizard";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: SITE_NAME },
  description: SITE_DESCRIPTION,
};

export default function PlannerPage() {
  return <PlannerWizard />;
}
