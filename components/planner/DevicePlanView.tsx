"use client";

import { useLanguage } from "@/contexts/language-context";
import { devicePlans, useDeviceHistory } from "@/lib/device-history";
import { MissingPlan } from "./DevicePlanWizard";
import SavedPlanView from "./SavedPlanView";

/** A guest's plan saved on this device, read from the browser's storage */
export default function DevicePlanView({ id }: { id: string }) {
  const { t } = useLanguage();
  const saved = useDeviceHistory(devicePlans).find((entry) => entry.id === id);

  if (!saved?.inputs) {
    return <MissingPlan text={saved ? t("plan.noDetails") : t("plan.missing")} />;
  }

  return (
    <SavedPlanView
      plan={{ kind: "device", id: saved.id, createdAt: saved.createdAt }}
      inputs={saved.inputs}
    />
  );
}
