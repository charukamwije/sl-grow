"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import type { StringKey } from "@/lib/i18n/strings";
import { LANGS, type Lang } from "@/lib/i18n/types";
import { waLink } from "@/lib/order/whatsapp";
import { isPlaceholderNumber, OWNER_WHATSAPP, OWNER_WHATSAPP_DISPLAY } from "@/lib/shop-config";
import AppLogo from "../icons/AppLogo";

const LANG_NAMES: Record<Lang, string> = {
  en: "English",
  si: "සිංහල",
  ta: "தமிழ்",
};

const EXPLORE: { href: string; key: StringKey }[] = [
  { href: "/planner", key: "nav.planner" },
  { href: "/shop", key: "nav.shop" },
  { href: "/guides", key: "nav.guides" },
  { href: "/plantation", key: "nav.plantation" },
  { href: "/join", key: "nav.join" },
];

const ORDERS: { href: string; key: StringKey }[] = [
  { href: "/cart", key: "nav.cart" },
  { href: "/account", key: "nav.account" },
];

export default function Footer() {
  const { lang, setLang, t } = useLanguage();
  const whatsappReady = !isPlaceholderNumber();

  const column = (title: StringKey, links: { href: string; key: StringKey }[]) => (
    <div>
      <h2 className="text-sm font-semibold text-white">{t(title)}</h2>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-gray-400 transition hover:text-white"
            >
              {t(link.key)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer id="site-footer" className="mt-16 bg-gray-950 text-gray-300">
      <div className="mx-auto max-w-6xl px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-14">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-[1.5fr_1fr_1fr_1.3fr]">
          <div className="col-span-2 space-y-4 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2">
              <AppLogo className="h-10 w-10" />
              <span className="font-bold text-white">{t("appName")}</span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-gray-400">
              {t("footer.about")}
            </p>
          </div>

          {column("footer.explore", EXPLORE)}
          {column("footer.help", ORDERS)}

          <div className="col-span-2 space-y-4 md:col-span-1">
            <h2 className="text-sm font-semibold text-white">{t("footer.contact")}</h2>
            {whatsappReady ? (
              <div className="space-y-2">
                <a
                  href={waLink("Hello! I have a question about home gardening.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1ebe5a]"
                >
                  💬 {t("footer.whatsapp")}
                </a>
                <p>
                  <a
                    href={`tel:+${OWNER_WHATSAPP}`}
                    className="text-sm font-medium tracking-wide text-gray-300 transition hover:text-white"
                  >
                    📞 {OWNER_WHATSAPP_DISPLAY}
                  </a>
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">{t("footer.whatsappSoon")}</p>
            )}
            <p className="text-xs leading-relaxed text-gray-500">{t("footer.hours")}</p>

            <div
              role="group"
              aria-label={`${t("language")} (footer)`}
              className="flex flex-wrap gap-2 pt-2"
            >
              {LANGS.map((code) => (
                <button
                  key={code}
                  type="button"
                  lang={code}
                  onClick={() => setLang(code)}
                  aria-pressed={lang === code}
                  className={`rounded-full px-3 py-1 text-xs transition ${
                    lang === code
                      ? "bg-white/10 text-white ring-1 ring-white/20"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {LANG_NAMES[code]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {t("appName")} · {t("footer.madeIn")} 🌴
          </p>
          <p className="max-w-md sm:text-right">{t("sav.how3")}</p>
        </div>
      </div>
    </footer>
  );
}
