import type { Metadata } from "next";
import GuidesIndex from "@/components/guides/GuidesIndex";

export const metadata: Metadata = {
  title: "Grow guides",
  description:
    "Step-by-step guides for setting up a home garden, preparing soil and growing 11 Sri Lankan vegetables.",
};

export default function GuidesPage() {
  return <GuidesIndex />;
}
