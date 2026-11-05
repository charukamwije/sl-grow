"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRightIcon, PlusIcon } from "@heroicons/react/20/solid";
import { savePlantation } from "@/app/plantation/manage/actions";
import { areaLabel, CROP_LABELS } from "@/lib/data/plantation-records";
import type { Plantation, PlantationSummary } from "@/lib/plantation/records";
import { formatLKR, formatNumber } from "@/lib/products";
import { btnPrimary, card, muted, subheading } from "../../ui/styles";
import RecordForm from "./RecordForm";

const CROP_ICON = { tea: "🍃", cinnamon: "🪵" } as const;

type PlantationListProps = {
  plantations: (Plantation & { summary: PlantationSummary })[];
  year: number;
};

/** The planter's plantations with this year's figures, and a way to add one */
export default function PlantationList({ plantations, year }: PlantationListProps) {
  const router = useRouter();
  const [adding, setAdding] = useState(plantations.length === 0);

  return (
    <div className="space-y-4">
      {plantations.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {plantations.map((plantation) => (
            <li key={plantation.id}>
              <Link
                href={`/plantation/manage/${plantation.id}`}
                className={`${card} group relative block !p-5 pr-12 transition hover:ring-emerald-200`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-2xl" aria-hidden="true">
                    {CROP_ICON[plantation.crop]}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">{plantation.name}</p>
                    <p className="text-xs text-gray-500">
                      {CROP_LABELS[plantation.crop]} ·{" "}
                      {areaLabel(plantation.area, plantation.area_unit, (n) => formatNumber(n, 2))}
                      {plantation.location && ` · ${plantation.location}`}
                    </p>
                  </div>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <dt className="text-xs text-gray-500">Profit {year}</dt>
                    <dd className={`font-semibold tabular-nums ${plantation.summary.profit < 0 ? "text-red-700" : "text-gray-900"}`}>
                      {formatLKR(plantation.summary.profit)}
                    </dd>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <dt className="text-xs text-gray-500">Harvest {year}</dt>
                    <dd className="font-semibold tabular-nums text-gray-900">
                      {formatNumber(plantation.summary.harvestKg, 0)} kg
                    </dd>
                  </div>
                </dl>
                <ChevronRightIcon
                  className="absolute right-4 top-6 h-5 w-5 text-gray-300 transition group-hover:text-emerald-600"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <section className={card}>
          <h2 className={subheading}>Add a plantation</h2>
          <RecordForm
            kind="plantation"
            crop={null}
            submitLabel="Add plantation"
            onSubmit={(values) => savePlantation(null, values)}
            onDone={(result) => {
              if (result.ok && result.id) router.push(`/plantation/manage/${result.id}`);
            }}
            onCancel={plantations.length > 0 ? () => setAdding(false) : undefined}
          />
        </section>
      ) : (
        <button type="button" className={btnPrimary} onClick={() => setAdding(true)}>
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          Add a plantation
        </button>
      )}

      {plantations.length === 0 && (
        <p className={muted}>
          Add your tea or cinnamon land to start recording harvests, money in and out, field
          work and workers&apos; wages. Only you can see these records.
        </p>
      )}
    </div>
  );
}
