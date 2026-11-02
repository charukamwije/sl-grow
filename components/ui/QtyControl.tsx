"use client";

import { useLanguage } from "@/contexts/language-context";

type QtyControlProps = {
  qty: number;
  onChange: (qty: number) => void;
  label: string;
};

export default function QtyControl({ qty, onChange, label }: QtyControlProps) {
  const { t } = useLanguage();

  return (
    <div className="inline-flex items-center overflow-hidden rounded-lg border border-green-700">
      <button
        type="button"
        onClick={() => onChange(qty - 1)}
        aria-label={`${t("decrease")}: ${label}`}
        className="px-3 py-1 text-lg leading-none text-green-800 hover:bg-green-50"
      >
        −
      </button>
      <span className="min-w-8 px-1 text-center text-sm font-semibold" aria-live="polite">
        {qty}
      </span>
      <button
        type="button"
        onClick={() => onChange(qty + 1)}
        aria-label={`${t("increase")}: ${label}`}
        className="px-3 py-1 text-lg leading-none text-green-800 hover:bg-green-50"
      >
        +
      </button>
    </div>
  );
}
