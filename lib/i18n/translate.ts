import { STRINGS, type StringKey } from "./strings";
import type { Lang, Localized } from "./types";

export type Vars = Record<string, string | number>;

export function fill(text: string, vars?: Vars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match
  );
}

export function translate(lang: Lang, key: StringKey, vars?: Vars): string {
  return fill(STRINGS[key][lang], vars);
}

export function localize(text: Localized, lang: Lang): string {
  return text[lang] || text.en;
}
