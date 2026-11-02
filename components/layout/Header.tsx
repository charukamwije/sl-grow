"use client";

import { useState, type ComponentType, type SVGProps } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  ShoppingCartIcon,
  SparklesIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useCart } from "@/contexts/cart-context";
import { useLanguage } from "@/contexts/language-context";
import { useSession } from "@/contexts/session-context";
import type { StringKey } from "@/lib/i18n/strings";
import { LANGS, type Lang } from "@/lib/i18n/types";
import AuthModal from "../modals/AuthModal";

const LANG_LABELS: Record<Lang, string> = {
  en: "EN",
  si: "සිං",
  ta: "த",
};

const LANG_NAMES: Record<Lang, string> = {
  en: "English",
  si: "සිංහල",
  ta: "தமிழ்",
};

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

// NFR-02: every main function is one tap away
const NAV: { href: string; key: StringKey; icon: Icon }[] = [
  { href: "/", key: "nav.planner", icon: SparklesIcon },
  { href: "/shop", key: "nav.shop", icon: BuildingStorefrontIcon },
  { href: "/guides", key: "nav.guides", icon: BookOpenIcon },
  { href: "/cart", key: "nav.cart", icon: ShoppingCartIcon },
  { href: "/plantation", key: "nav.plantation", icon: ChartBarIcon },
  { href: "/account", key: "nav.account", icon: UserCircleIcon },
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
    <>
      <header className="sticky top-0 z-20 border-b border-black/5 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 text-lg shadow-sm">
              🥬
            </span>
            <span className="truncate text-sm font-bold text-gray-900 sm:text-base">
              {t("appName")}
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <div
              role="group"
              aria-label={t("language")}
              className="flex rounded-full bg-gray-100 p-0.5 text-xs"
            >
              {LANGS.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  aria-pressed={lang === code}
                  aria-label={LANG_NAMES[code]}
                  lang={code}
                  className={`rounded-full px-2.5 py-1 font-medium transition ${
                    lang === code
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
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
                  className="hidden max-w-[8rem] items-center gap-1 truncate rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100 sm:flex"
                >
                  <UserCircleIcon className="h-4 w-4 shrink-0" />
                  {firstName}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="rounded-full bg-gray-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-gray-700"
                >
                  {t("signIn")}
                </button>
              ))}
          </div>
        </div>
      </header>

      {/* One nav: a bottom tab bar on phones, a centred pill bar on larger screens */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-black/5 bg-white/95 backdrop-blur-lg md:sticky md:top-16 md:border-b md:border-t-0 md:bg-white/80"
      >
        <ul className="mx-auto grid h-16 max-w-5xl grid-cols-6 md:flex md:h-auto md:justify-center md:gap-1 md:py-2">
          {NAV.map(({ href, key, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={href} className="min-w-0">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex h-full flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium transition md:flex-row md:gap-1.5 md:rounded-full md:px-4 md:py-2 md:text-sm ${
                    active
                      ? "text-emerald-700 md:bg-emerald-50"
                      : "text-gray-500 hover:text-gray-900 md:hover:bg-gray-50"
                  }`}
                >
                  <span className="relative">
                    <Icon className="h-6 w-6 md:h-5 md:w-5" aria-hidden="true" />
                    {href === "/cart" && count > 0 && (
                      <span className="absolute -right-2.5 -top-1.5 min-w-[1.125rem] rounded-full bg-amber-400 px-1 text-center text-[10px] font-bold leading-[1.125rem] text-gray-900">
                        {count}
                      </span>
                    )}
                  </span>
                  <span className="w-full truncate text-center md:w-auto">{t(key)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {accountsEnabled && (
        <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
}
