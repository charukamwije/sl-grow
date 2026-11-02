export const LANGS = ["en", "si", "ta"] as const;

export type Lang = (typeof LANGS)[number];

// Every customer-facing text in the data files carries all three languages
export type Localized = Record<Lang, string>;
