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
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
          guide.id === currentId
            ? "border-green-700 bg-green-700 text-white"
            : "border-green-100 bg-white text-gray-900 hover:bg-green-50"
        }`}
      >
        <span aria-hidden="true">{guide.icon}</span>
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
