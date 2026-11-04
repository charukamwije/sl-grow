import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "@heroicons/react/20/solid";
import { btnPrimary, card, heading, muted } from "@/components/ui/styles";
import { listAdminGuides } from "@/lib/guides-server";
import { requireRole } from "@/lib/supabase/admin-auth";

export const metadata: Metadata = { title: "Guides" };

const KIND_LABELS = {
  package: "Starter",
  soil: "Soil",
  vegetable: "Vegetable",
  general: "Added in console",
} as const;

export default async function AdminGuidesPage() {
  await requireRole("admin");

  const guides = await listAdminGuides();

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={heading}>Grow guides</h1>
          <p className={muted}>
            Edit any guide&apos;s steps in English, Sinhala and Tamil. Built-in guides are linked from
            the shop, planner and courses, so they stay on show; guides you add can be hidden or
            deleted.
          </p>
        </div>
        <Link href="/admin/guides/new" className={btnPrimary}>
          <PlusIcon className="h-5 w-5" aria-hidden="true" />
          New guide
        </Link>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {guides.map((guide) => {
          const missingSi = guide.steps.filter((step) => !step.text.si).length;
          const missingTa = guide.steps.filter((step) => !step.text.ta).length;
          return (
            <li key={guide.id}>
              <Link
                href={`/admin/guides/${guide.id}`}
                className={`${card} flex h-full items-start gap-4 transition hover:ring-emerald-300 ${
                  guide.active ? "" : "opacity-70"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-2xl"
                >
                  {guide.icon}
                </span>
                <span className="min-w-0 space-y-1">
                  <span className="block font-semibold text-gray-900">{guide.name.en}</span>
                  <span className="block text-xs text-gray-500">
                    {KIND_LABELS[guide.kind]} · {guide.steps.length} steps
                    {guide.active ? "" : " · Hidden"}
                  </span>
                  {(missingSi > 0 || missingTa > 0) && (
                    <span className="block text-xs text-amber-700">
                      Untranslated steps: {missingSi > 0 ? `${missingSi} Sinhala` : ""}
                      {missingSi > 0 && missingTa > 0 ? ", " : ""}
                      {missingTa > 0 ? `${missingTa} Tamil` : ""}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
