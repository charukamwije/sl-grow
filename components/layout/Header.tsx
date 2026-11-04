"use client";

import { useState, type ComponentType, type SVGProps } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AcademicCapIcon,
  ArrowRightEndOnRectangleIcon,
  ArrowRightStartOnRectangleIcon,
  Bars3Icon,
  BookOpenIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ShoppingCartIcon,
  SparklesIcon,
  UserCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import { useLanguage } from "@/contexts/language-context";
import { useSession } from "@/contexts/session-context";
import type { StringKey } from "@/lib/i18n/strings";
import { LANGS, type Lang } from "@/lib/i18n/types";
import { hasRole } from "@/lib/supabase/roles";
import AppLogo from "../icons/AppLogo";
import AuthModal from "../modals/AuthModal";
import ProfileMenu from "./ProfileMenu";

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

// NFR-02: every main function is one tap away. The cart and the account are
// not listed here: the cart has its own icon in the bar, with the item count,
// and the account is the profile menu next to it (the menu's foot on phones).
export const NAV: { href: string; key: StringKey; icon: Icon }[] = [
  { href: "/planner", key: "nav.planner", icon: SparklesIcon },
  { href: "/shop", key: "nav.shop", icon: BuildingStorefrontIcon },
  { href: "/guides", key: "nav.guides", icon: BookOpenIcon },
  { href: "/plantation", key: "nav.plantation", icon: ChartBarIcon },
  { href: "/join", key: "nav.join", icon: AcademicCapIcon },
];

const mobileItem = (active: boolean) =>
  `flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-base font-medium transition ${
    active ? "bg-emerald-50 text-emerald-700" : "text-gray-800 hover:bg-gray-50"
  }`;

function LanguageSwitch({ large }: { large?: boolean }) {
  const { lang, setLang, t } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t("language")}
      className={`flex rounded-full bg-gray-100 p-0.5 ${large ? "text-sm" : "text-xs"}`}
    >
      {LANGS.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          aria-label={LANG_NAMES[code]}
          lang={code}
          className={`rounded-full font-medium transition ${
            large ? "flex-1 px-4 py-2" : "px-2.5 py-1.5"
          } ${
            lang === code
              ? "bg-white text-emerald-700 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {large ? LANG_NAMES[code] : LANG_LABELS[code]}
        </button>
      ))}
    </div>
  );
}

export default function Header() {
  const { user, accountsEnabled } = useSession();
  const pathname = usePathname();
  const { t } = useLanguage();
  const { count } = useCart();
  const { signOut, isAuthLoading } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => pathname.startsWith(href);
  const isAdmin = hasRole(user?.role, "admin");
  const closeMenu = () => setMenuOpen(false);

  const openSignIn = () => {
    closeMenu();
    setIsModalOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <Link href="/" className="group flex min-w-0 items-center gap-2" onClick={closeMenu}>
            <AppLogo className="h-9 w-9 rounded-xl shadow-sm transition group-hover:rotate-[-6deg]" />
            <span className="truncate text-base font-bold tracking-tight text-gray-900 sm:text-lg">
              {t("appName")}
            </span>
          </Link>

          {/* The tabs, inline in the bar on larger screens */}
          <nav aria-label="Main" className="hidden flex-1 justify-center lg:flex">
            <ul className="flex items-center gap-1">
              {NAV.map(({ href, key, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-2 text-sm font-medium transition xl:px-3 ${
                        active
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <Icon className="hidden h-5 w-5 xl:block" aria-hidden="true" />
                      {t(key)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0">
            <div className="hidden sm:block">
              <LanguageSwitch />
            </div>

            <Link
              href="/cart"
              aria-label={t("nav.cart")}
              aria-current={isActive("/cart") ? "page" : undefined}
              onClick={closeMenu}
              className={`relative flex h-10 w-10 items-center justify-center rounded-full transition ${
                isActive("/cart")
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <ShoppingCartIcon className="h-6 w-6" aria-hidden="true" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 min-w-[1.25rem] rounded-full bg-amber-400 px-1 text-center text-[11px] font-bold leading-5 text-gray-900 ring-2 ring-white">
                  {count}
                </span>
              )}
            </Link>

            <div className="hidden lg:block">
              <ProfileMenu onSignIn={openSignIn} />
            </div>

            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full text-gray-700 transition hover:bg-gray-100 lg:hidden"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? t("closeMenu") : t("menu")}
            >
              {menuOpen ? (
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* The same tabs, folded into a menu on phones and tablets */}
        {menuOpen && (
          <div
            id="mobile-menu"
            className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-black/5 bg-white px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 shadow-lg lg:hidden"
          >
            <nav aria-label="Main">
              <ul className="space-y-1">
                {NAV.map(({ href, key, icon: Icon }) => {
                  const active = isActive(href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={closeMenu}
                        aria-current={active ? "page" : undefined}
                        className={mobileItem(active)}
                      >
                        <Icon className="h-6 w-6" aria-hidden="true" />
                        {t(key)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            {/* The profile menu's items, at the foot of the phone menu */}
            <div className="mt-4 space-y-1 border-t border-black/5 pt-4">
              {user && (
                <div className="px-4 pb-2">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {user.displayName || user.email}
                  </p>
                  {user.displayName && user.email && (
                    <p className="truncate text-xs text-gray-500">{user.email}</p>
                  )}
                </div>
              )}
              <Link
                href="/account"
                onClick={closeMenu}
                aria-current={isActive("/account") ? "page" : undefined}
                className={mobileItem(isActive("/account"))}
              >
                <UserCircleIcon className="h-6 w-6" aria-hidden="true" />
                {t("nav.account")}
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={closeMenu}
                  aria-current={isActive("/admin") ? "page" : undefined}
                  className={mobileItem(isActive("/admin"))}
                >
                  <Cog6ToothIcon className="h-6 w-6" aria-hidden="true" />
                  Admin panel
                </Link>
              )}
              {accountsEnabled &&
                (user ? (
                  <button
                    type="button"
                    disabled={isAuthLoading}
                    onClick={() => {
                      closeMenu();
                      void signOut();
                    }}
                    className={`${mobileItem(false)} w-full disabled:opacity-50`}
                  >
                    <ArrowRightStartOnRectangleIcon className="h-6 w-6" aria-hidden="true" />
                    {t("signOut")}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isAuthLoading}
                    onClick={openSignIn}
                    className={`${mobileItem(false)} w-full disabled:opacity-50`}
                  >
                    <ArrowRightEndOnRectangleIcon className="h-6 w-6" aria-hidden="true" />
                    {t("signIn")}
                  </button>
                ))}
            </div>
            <div className="mt-3 sm:hidden">
              <LanguageSwitch large />
            </div>
          </div>
        )}
      </header>

      {accountsEnabled && (
        <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
}
