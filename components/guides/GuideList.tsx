"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { GUIDES, type Guide } from "@/lib/data/guides";

type GuideListProps = {
  /** The guide being read, highlighted in the list */
  currentId?: string;
  compact?: boolean;
};

// FR-G-01: every guide, selectable
export default function GuideList({ currentId, compact }: GuideListProps) {
  const { l } = useLanguage();

  const item = (guide: Guide) => (
    <li key={guide.id}>
      <Link
        href={`/guides/${guide.id}`}
        aria-current={guide.id === currentId ? "page" : undefined}
        className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
          guide.id === currentId
            ? "bg-emerald-600 text-white shadow-sm"
            : "bg-white text-gray-900 shadow-sm ring-1 ring-black/5 hover:ring-emerald-300"
        }`}
      >
        <span className="text-2xl" aria-hidden="true">{guide.icon}</span>
        <span>{l(guide.name)}</span>
      </Link>
    </li>
  );

  return (
    <ul
      className={
        compact
          ? "flex gap-2 overflow-x-auto pb-1 [&>li]:shrink-0"
          : "grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
      }
    >
      {GUIDES.map(item)}
    </ul>
  );
}
