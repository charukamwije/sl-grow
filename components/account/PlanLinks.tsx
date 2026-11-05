"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { btnSmall } from "../ui/styles";

/** View and Edit for a saved plan in a list */
export default function PlanLinks({ view, edit }: { view: string; edit: string }) {
  const { t } = useLanguage();

  return (
    <span className="flex gap-2">
      <Link href={view} className={btnSmall}>
        {t("plan.view")}
      </Link>
      <Link
        href={edit}
        className="inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-50"
      >
        {t("plan.edit")}
      </Link>
    </span>
  );
}
