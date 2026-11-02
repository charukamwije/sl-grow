"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/contexts/cart-context";
import { useLanguage } from "@/contexts/language-context";
import { useSession } from "@/contexts/session-context";
import type { StringKey } from "@/lib/i18n/strings";
import { LANGS, type Lang } from "@/lib/i18n/types";
import AuthModal from "../modals/AuthModal";

const LANG_LABELS: Record<Lang, string> = {
  en: "English",
  si: "සිංහල",
  ta: "தமிழ்",
};

// NFR-02: every main function is one tap away
const NAV: { href: string; key: StringKey }[] = [
  { href: "/", key: "nav.planner" },
  { href: "/shop", key: "nav.shop" },
  { href: "/guides", key: "nav.guides" },
  { href: "/cart", key: "nav.cart" },
  { href: "/plantation", key: "nav.plantation" },
  { href: "/account", key: "nav.account" },
];

export default function Header() {
  const { user, accountsEnabled } = useSession();
  const pathname = usePathname();
  const { lang, setLang, t } = useLanguage();
  const { count } = useCart();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const firstName =
    user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "";

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-20 border-b border-green-800 bg-green-800 text-white shadow">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 pt-3">
        <Link href="/" className="min-w-0">
          <span className="block truncate text-base font-bold sm:text-lg">
            🥬 {t("appName")}
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <div
            role="group"
            aria-label={t("language")}
            className="flex overflow-hidden rounded-md border border-green-600 text-xs"
          >
            {LANGS.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                aria-pressed={lang === code}
                lang={code}
                className={`px-2 py-1 ${
                  lang === code
                    ? "bg-white font-semibold text-green-900"
                    : "text-green-50 hover:bg-green-700"
                }`}
              >
                {LANG_LABELS[code]}
              </button>
            ))}
          </div>

          {accountsEnabled &&
            (user ? (
              <Link
                href="/account"
                className="max-w-[8rem] truncate rounded-md bg-green-700 px-2 py-1 text-xs font-medium hover:bg-green-600"
              >
                👤 {firstName}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-green-900 hover:bg-green-50"
              >
                {t("signIn")}
              </button>
            ))}
        </div>
      </div>

      <nav className="mx-auto max-w-5xl overflow-x-auto px-2">
        <ul className="flex gap-1 whitespace-nowrap py-2 text-sm">
          {NAV.map(({ href, key }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={`flex items-center gap-1 rounded-md px-3 py-1.5 ${
                  isActive(href)
                    ? "bg-white font-semibold text-green-900"
                    : "text-green-50 hover:bg-green-700"
                }`}
              >
                {t(key)}
                {href === "/cart" && (
                  <span
                    className={`min-w-5 rounded-full px-1.5 text-center text-xs font-bold ${
                      isActive(href)
                        ? "bg-green-800 text-white"
                        : "bg-amber-300 text-green-950"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {accountsEnabled && (
        <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      )}
    </header>
  );
}
