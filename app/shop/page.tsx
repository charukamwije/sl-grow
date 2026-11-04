import type { Metadata } from "next";
import ShopView from "@/components/shop/ShopView";
import { guideIdsByVeg } from "@/lib/guides";
import { getGuides } from "@/lib/guides-server";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Seedlings, seeds, grow bags, fertilizer and tools for a home vegetable garden in Sri Lanka.",
};

export default async function ShopPage() {
  return <ShopView guideIds={guideIdsByVeg(await getGuides())} />;
}
