import type { Metadata } from "next";
import PlantationNav from "@/components/plantation/PlantationNav";
import PlantationWizard from "@/components/plantation/PlantationWizard";

export const metadata: Metadata = {
  title: "Plantation investment",
  description:
    "Estimate the setup cost, payback, NPV and IRR of planting Ceylon cinnamon or tea.",
};

export default function PlantationPage() {
  return (
    <div className="space-y-4">
      <PlantationNav current="calculator" />
      <PlantationWizard />
    </div>
  );
}
