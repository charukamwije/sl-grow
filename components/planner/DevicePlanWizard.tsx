"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { devicePlans, useDeviceHistory } from "@/lib/device-history";
import { btnPrimary, card, muted } from "../ui/styles";
import PlannerWizard from "./PlannerWizard";

/**
 * The planner opened on a guest's plan saved on this device. The plan is
 * read from the browser's storage, so the server renders nothing for it.
 */
export default function DevicePlanWizard({ id }: { id: string }) {
  const { t } = useLanguage();
  const plans = useDeviceHistory(devicePlans);
  const saved = plans.find((entry) => entry.id === id);

  if (!saved?.inputs) {
    return <MissingPlan text={saved ? t("plan.noDetails") : t("plan.missing")} />;
  }

  // Keyed, so the form starts again from the plan once storage is read
  return (
    <PlannerWizard
      key={saved.id}
      initial={saved.inputs}
      editing={{ kind: "device", id: saved.id }}
    />
  );
}

export function MissingPlan({ text }: { text: string }) {
  const { t } = useLanguage();

  return (
    <div className={`${card} space-y-3 text-center`}>
      <p className={muted}>{text}</p>
      <Link href="/planner" className={btnPrimary}>
        {t("nav.planner")}
      </Link>
    </div>
  );
}
