"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { StringKey } from "@/lib/i18n/strings";
import { localize, translate, type Vars } from "@/lib/i18n/translate";
import type { Lang, Localized } from "@/lib/i18n/types";

type LanguageContextType = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Interface text by key */
  t: (key: StringKey, vars?: Vars) => string;
  /** A data record's text in the current language */
  l: (text: Localized) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

// FR-L-04: English by default. Not remembered across visits yet (OI-12).
export const LanguageProvider = ({
  children,
  initialLang = "en",
}: {
  children: ReactNode;
  initialLang?: Lang;
}) => {
  const [lang, setLang] = useState<Lang>(initialLang);

  // Screen readers and the Sinhala/Tamil font stacks key off the lang attribute
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback(
    (key: StringKey, vars?: Vars) => translate(lang, key, vars),
    [lang]
  );
  const l = useCallback((text: Localized) => localize(text, lang), [lang]);

  const value = useMemo(() => ({ lang, setLang, t, l }), [lang, t, l]);

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
