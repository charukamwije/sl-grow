"use client";

import { useLanguage } from "@/contexts/language-context";
import type { GuideSummary } from "@/lib/guides";
import { heading, muted } from "../ui/styles";
import GuideList from "./GuideList";

export default function GuidesIndex({ guides }: { guides: GuideSummary[] }) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <div>
        <h1 className={heading}>{t("guides.title")}</h1>
        <p className={muted}>{t("guides.intro")}</p>
      </div>
      <GuideList guides={guides} />
    </div>
  );
}
