import type { GuideStep } from "./data/guides";
import { LANGS, type Localized } from "./i18n/types";

/** What the guide editor submits, as JSON */
export type GuideInput = {
  name: Localized;
  icon: string;
  /** Readiness time, shown for the package and soil guides */
  time: Localized | null;
  steps: GuideStep[];
  products: string[];
  active: boolean;
};

export type GuideFormErrors = {
  form?: string;
  id?: string;
  name?: string;
  icon?: string;
  products?: string;
  /** Per step, by index */
  steps?: Record<number, string>;
  stepsList?: string;
};

export const GUIDE_ID_PATTERN = /^[a-z][a-z0-9-]{1,39}$/;

export const MAX_STEPS = 20;
const MAX_TITLE = 120;
const MAX_TEXT = 2000;
const MAX_NAME = 80;
const MAX_ICON = 16;
const MAX_PRODUCTS = 30;

function str(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length <= max ? trimmed : null;
}

function localized(value: unknown, max: number): Localized | null {
  const raw = (value ?? {}) as Record<string, unknown>;
  const result = {} as Localized;
  for (const lang of LANGS) {
    const text = str(raw[lang] ?? "", max);
    if (text === null) return null;
    result[lang] = text;
  }
  return result;
}

function icon(value: unknown): string | null {
  const text = str(value, MAX_ICON * 4);
  if (!text) return null;
  return [...text].length <= MAX_ICON ? text : null;
}

/**
 * Checks a guide from the editor. Product references are only checked for
 * shape here; the action checks they exist and are on sale.
 */
export function parseGuideInput(
  value: unknown
): { input: GuideInput; errors?: never } | { input?: never; errors: GuideFormErrors } {
  const raw = (value ?? {}) as Record<string, unknown>;
  const errors: GuideFormErrors = {};

  const name = localized(raw.name, MAX_NAME);
  if (!name || !name.en) errors.name = `An English name is required, up to ${MAX_NAME} characters.`;

  const guideIcon = icon(raw.icon);
  if (!guideIcon) errors.icon = "Use one emoji.";

  let time: Localized | null = null;
  if (raw.time != null) {
    time = localized(raw.time, MAX_NAME);
    if (!time) errors.form = "The readiness time is too long.";
    else if (!time.en) time = null;
  }

  const steps: GuideStep[] = [];
  const stepErrors: Record<number, string> = {};
  const rawSteps = Array.isArray(raw.steps) ? raw.steps : null;

  if (!rawSteps || rawSteps.length === 0) {
    errors.stepsList = "A guide needs at least one step.";
  } else if (rawSteps.length > MAX_STEPS) {
    errors.stepsList = `A guide can have up to ${MAX_STEPS} steps.`;
  } else {
    rawSteps.forEach((rawStep, index) => {
      const step = (rawStep ?? {}) as Record<string, unknown>;
      const stepIcon = icon(step.icon);
      const title = localized(step.title, MAX_TITLE);
      const text = localized(step.text, MAX_TEXT);

      if (!stepIcon || !title || !text || !title.en || !text.en) {
        stepErrors[index] = `Each step needs an emoji, and an English title (up to ${MAX_TITLE} characters) and text (up to ${MAX_TEXT}).`;
        return;
      }
      steps.push({ icon: stepIcon, title, text });
    });
    if (Object.keys(stepErrors).length > 0) errors.steps = stepErrors;
  }

  const rawProducts = Array.isArray(raw.products) ? raw.products : [];
  const products = [...new Set(rawProducts.filter((id): id is string => typeof id === "string"))];
  if (products.length !== rawProducts.length) {
    errors.products = "Each recommended product can be listed once.";
  } else if (products.length > MAX_PRODUCTS) {
    errors.products = `Recommend up to ${MAX_PRODUCTS} products.`;
  } else if (products.some((id) => !/^[a-z]+_[a-z0-9_]+$/.test(id))) {
    errors.products = "Choose products from the list.";
  }

  if (Object.keys(errors).length > 0) return { errors };

  return {
    input: {
      name: name!,
      icon: guideIcon!,
      time,
      steps,
      products,
      active: raw.active !== false,
    },
  };
}
