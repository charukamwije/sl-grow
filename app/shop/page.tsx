import type { Metadata } from "next";
import ShopView from "@/components/shop/ShopView";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Seedlings, seeds, grow bags, fertilizer and tools for a home vegetable garden in Sri Lanka.",
};

export default function ShopPage() {
  return <ShopView />;
}
