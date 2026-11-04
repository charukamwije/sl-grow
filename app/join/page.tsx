import type { Metadata } from "next";
import JoinPage from "@/components/join/JoinPage";
import { listOwnApplications, type OwnApplication } from "@/lib/certifications-server";
import { getTrack } from "@/lib/data/certifications";
import { getServerUser } from "@/lib/supabase/auth-server";
import { isTransientDbError } from "@/lib/supabase/store";

export const metadata: Metadata = {
  title: "Join",
  description:
    "Learn, apply what you learn, and earn an Aswedduma Certified digital badge for your home garden, your seeds or your plantation.",
};

type JoinProps = { searchParams: Promise<{ path?: string }> };

export default async function Join({ searchParams }: JoinProps) {
  // ?path=seeds opens that path, e.g. when returning from its course
  const path = getTrack((await searchParams).path ?? "")?.id;

  const user = await getServerUser();
  let applications: OwnApplication[] = [];
  if (user) {
    try {
      applications = await listOwnApplications(user.uid);
    } catch (error) {
      // The page still teaches; only the list of applications is missing
      if (!isTransientDbError(error)) throw error;
      console.error("Failed to load applications:", error);
    }
  }

  return <JoinPage initialPath={path} applications={applications} />;
}
