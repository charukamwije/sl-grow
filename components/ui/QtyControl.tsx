"use client";

import { MinusIcon, PlusIcon } from "@heroicons/react/20/solid";
import { useLanguage } from "@/contexts/language-context";

type QtyControlProps = {
  qty: number;
  onChange: (qty: number) => void;
  label: string;
};

export default function QtyControl({ qty, onChange, label }: QtyControlProps) {
  const { t } = useLanguage();
  const button =
    "flex h-8 w-8 items-center justify-center rounded-full text-emerald-700 transition hover:bg-white active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";

  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 p-1">
      <button
        type="button"
        onClick={() => onChange(qty - 1)}
        aria-label={`${t("decrease")}: ${label}`}
        className={button}
      >
        <MinusIcon className="h-4 w-4" />
      </button>
      <span
        className="min-w-7 text-center text-sm font-semibold text-gray-900"
        aria-live="polite"
      >
        {qty}
      </span>
      <button
        type="button"
        onClick={() => onChange(qty + 1)}
        aria-label={`${t("increase")}: ${label}`}
        className={button}
      >
        <PlusIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
