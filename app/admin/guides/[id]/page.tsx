import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import GuideEditor from "@/components/admin/GuideEditor";
import { btnGhost, heading, muted } from "@/components/ui/styles";
import { getAdminGuide } from "@/lib/guides-server";
import { requireRole } from "@/lib/supabase/admin-auth";

export const metadata: Metadata = { title: "Edit guide" };

export default async function EditGuidePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole("admin");

  const guide = await getAdminGuide((await params).id);
  if (!guide) notFound();

  const created = (await searchParams).created === "1";

  return (
    <>
      <Link href="/admin/guides" className={btnGhost}>
        ← Guides
      </Link>
      <div>
        <h1 className={heading}>
          <span aria-hidden="true">{guide.icon}</span> {guide.name.en}
        </h1>
        <p className={muted}>
          <Link href={`/guides/${guide.id}`} className="text-emerald-700 hover:underline">
            /guides/{guide.id}
          </Link>
          {guide.active ? "" : " · Hidden"}
        </p>
      </div>
      {created && (
        <p role="status" className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-800">
          Guide created.
        </p>
      )}
      <GuideEditor guide={guide} />
    </>
  );
}
