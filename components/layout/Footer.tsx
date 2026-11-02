"use client";

import { useLanguage } from "@/contexts/language-context";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-green-100 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-4 text-xs text-gray-600">
        <p>
          {t("appName")} · {t("tagline")}
        </p>
        <p className="mt-1">{t("sav.how3")}</p>
      </div>
    </footer>
  );
}
