import type { Metadata } from "next";
import Link from "next/link";
import GuideEditor from "@/components/admin/GuideEditor";
import { btnGhost, heading, muted } from "@/components/ui/styles";
import { requireRole } from "@/lib/supabase/admin-auth";

export const metadata: Metadata = { title: "New guide" };

export default async function NewGuidePage() {
  await requireRole("admin");

  return (
    <>
      <Link href="/admin/guides" className={btnGhost}>
        ← Guides
      </Link>
      <h1 className={heading}>New guide</h1>
      <p className={muted}>
        A general guide, listed after the built-in ones on the Grow guides page.
      </p>
      <GuideEditor />
    </>
  );
}
