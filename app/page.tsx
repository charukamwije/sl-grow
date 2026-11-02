import type { Metadata } from "next";
import LandingPage from "@/components/landing/LandingPage";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE },
  description: SITE_DESCRIPTION,
};

export default function HomePage() {
  return <LandingPage />;
}
