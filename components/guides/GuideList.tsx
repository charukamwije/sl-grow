"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { GUIDES, type Guide } from "@/lib/data/guides";
import { VEGETABLES } from "@/lib/data/vegetables";

type GuideListProps = {
  /** The guide being read, highlighted in the list */
  currentId?: string;
  compact?: boolean;
};

const daysFor = (guide: Guide) =>
  VEGETABLES.find((veg) => veg.id === guide.vegId)?.daysToHarvest;

// FR-G-01: every guide, selectable. Big pictures first, few words.
export default function GuideList({ currentId, compact }: GuideListProps) {
  const { t, l } = useLanguage();

  if (compact) {
    return (
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {GUIDES.map((guide) => (
          <li key={guide.id} className="shrink-0">
            <Link
              href={`/guides/${guide.id}`}
              aria-current={guide.id === currentId ? "page" : undefined}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                guide.id === currentId
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white text-gray-800 shadow-sm ring-1 ring-black/5 hover:ring-emerald-300"
              }`}
            >
              <span className="text-xl" aria-hidden="true">{guide.icon}</span>
              {l(guide.name)}
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {GUIDES.map((guide) => {
        const days = daysFor(guide);
        return (
          <li key={guide.id}>
            <Link
              href={`/guides/${guide.id}`}
              className="lift flex h-full flex-col items-center gap-2 rounded-3xl bg-white p-5 text-center shadow-sm ring-1 ring-black/5 hover:ring-emerald-300"
            >
              <span
                aria-hidden="true"
                className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-5xl"
              >
                {guide.icon}
              </span>
              <span className="text-base font-semibold text-gray-900">{l(guide.name)}</span>
              <span className="text-xs text-gray-500">
                {days
                  ? `⏱️ ${t("guides.firstHarvest", { n: days })}`
                  : `👣 ${t("guides.stepsCount", { n: guide.steps.length })}`}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
