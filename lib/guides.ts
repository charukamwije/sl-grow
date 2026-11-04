import type { Guide, GuideKind } from "./data/guides";
import type { Localized } from "./i18n/types";

/** What a list of guides needs - not the steps, which are most of a guide */
export type GuideSummary = {
  id: string;
  kind: GuideKind;
  icon: string;
  name: Localized;
  vegId?: string;
  stepCount: number;
};

export function summarizeGuides(guides: Guide[]): GuideSummary[] {
  return guides.map((guide) => ({
    id: guide.id,
    kind: guide.kind,
    icon: guide.icon,
    name: guide.name,
    ...(guide.vegId ? { vegId: guide.vegId } : {}),
    stepCount: guide.steps.length,
  }));
}

/** vegetable ID → guide ID, for the shop's "Guide" links */
export function guideIdsByVeg(guides: Guide[]): Record<string, string> {
  return Object.fromEntries(
    guides.filter((guide) => guide.vegId).map((guide) => [guide.vegId!, guide.id])
  );
}

/** Built-in guides are linked from the shop, planner and courses */
export function isBuiltInGuide(kind: GuideKind): boolean {
  return kind !== "general";
}

const PRODUCT_REF = /\[\[([a-z0-9_]+)\]\]/g;

/** Every product a guide recommends or names in a step's text, in any language */
export function productIdsInGuide(guide: Pick<Guide, "steps" | "products">): Set<string> {
  const ids = new Set(guide.products);

  for (const step of guide.steps) {
    for (const text of [...Object.values(step.title), ...Object.values(step.text)]) {
      for (const match of text.matchAll(PRODUCT_REF)) ids.add(match[1]);
    }
  }

  return ids;
}
