"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/20/solid";
import { useCatalog } from "@/contexts/catalog-context";
import { useLanguage } from "@/contexts/language-context";
import { useNotification } from "@/contexts/notification-context";
import { devicePlans } from "@/lib/device-history";
import { computePlan, type PlannerInputs } from "@/lib/planner/calc";
import LocalTime from "../ui/LocalTime";
import { btnGhost, btnSecondary, eyebrow, heading } from "../ui/styles";
import PlanResults, { type EditingPlan } from "./PlanResults";

type SavedPlanViewProps = {
  plan: EditingPlan & { createdAt: string; updatedAt?: string | null };
  inputs: PlannerInputs;
};

/**
 * A saved plan on its own page, worked out again from what was entered, with
 * today's shop prices. It can be edited in the planner or deleted.
 */
export default function SavedPlanView({ plan, inputs }: SavedPlanViewProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const catalog = useCatalog();
  const { addSuccessNotification, addErrorNotification } = useNotification();
  const [deleting, setDeleting] = useState(false);
  const result = useMemo(() => computePlan(inputs, catalog), [inputs, catalog]);
  const editHref = plan.kind === "account" ? `/planner?plan=${plan.id}` : `/planner?device=${plan.id}`;

  const remove = async () => {
    if (!window.confirm(t("plan.deleteConfirm"))) return;

    if (plan.kind === "device") {
      devicePlans.remove((entry) => entry.id === plan.id);
      addSuccessNotification(t("plan.deleted"));
      router.push("/account");
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/plans/${plan.id}`, { method: "DELETE" });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) throw new Error(data?.error);
      addSuccessNotification(t("plan.deleted"));
      router.push("/account");
      router.refresh();
    } catch (error) {
      console.error("Plan delete error:", error);
      addErrorNotification(t("plan.deleteFailed"));
      setDeleting(false);
    }
  };

  const actions = (
    <>
      <Link href={editHref} className={btnSecondary}>
        <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
        {t("plan.edit")}
      </Link>
      <button
        type="button"
        onClick={remove}
        disabled={deleting}
        className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-red-700 ring-1 ring-red-200 transition hover:bg-red-50 disabled:opacity-60"
      >
        <TrashIcon className="h-4 w-4" aria-hidden="true" />
        {t("plan.delete")}
      </button>
    </>
  );

  return (
    <div className="space-y-4 pb-8">
      <Link href="/account" className={btnGhost}>
        ← {t("plan.back")}
      </Link>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className={eyebrow}>
            {t("plan.savedOn")} <LocalTime value={plan.updatedAt ?? plan.createdAt} />
          </p>
          <h1 className={heading}>{t("plan.title")}</h1>
        </div>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </header>
      <PlanResults plan={result} inputs={inputs} actions={actions} />
    </div>
  );
}
