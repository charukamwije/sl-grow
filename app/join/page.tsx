import type { Metadata } from "next";
import JoinPage from "@/components/join/JoinPage";
import { getTrack } from "@/lib/data/certifications";

export const metadata: Metadata = {
  title: "Join",
  description:
    "Learn, apply what you learn, and earn an Aswedduma Certified digital badge for your home garden, your seeds or your plantation.",
};

type JoinProps = { searchParams: Promise<{ path?: string }> };

export default async function Join({ searchParams }: JoinProps) {
  // ?path=seeds opens that path, e.g. when returning from its course
  const path = getTrack((await searchParams).path ?? "")?.id;
  return <JoinPage initialPath={path} />;
}
