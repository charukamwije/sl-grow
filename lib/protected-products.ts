import {
  CONTAINER_LARGE,
  CONTAINER_MEDIUM,
  CONTAINER_SMALL,
  PRODUCTS,
  SHARED_SUPPLIES,
  TRELLIS,
} from "./data/products";
import { GUIDES, SOIL_MIX_PER_BAG, type Guide } from "./data/guides";
import { VEGETABLES } from "./data/vegetables";
import { productIdsInGuide } from "./guides";

/**
 * Products the planner's code refers to by ID: its containers, trellis and
 * shared supplies, the soil mix, and the seedling of each vegetable.
 */
function collectPlannerIds(): Set<string> {
  const ids = new Set<string>([
    CONTAINER_LARGE,
    CONTAINER_MEDIUM,
    CONTAINER_SMALL,
    TRELLIS,
    ...SHARED_SUPPLIES.map((line) => line.productId),
    ...SOIL_MIX_PER_BAG.map((line) => line.productId),
  ]);

  const vegIds = new Set(VEGETABLES.map((veg) => veg.id));
  for (const product of PRODUCTS) {
    if (product.category === "seedlings" && product.vegId && vegIds.has(product.vegId)) {
      ids.add(product.id);
    }
  }

  return ids;
}

export const PLANNER_PRODUCT_IDS: ReadonlySet<string> = collectPlannerIds();

/**
 * The products that may not be hidden or deleted: the planner's, plus every
 * product the given guides recommend or name. Admins may still change their
 * price, names and photo. On the server the guides come from the database
 * (lib/guides-server.ts `getProtectedProductIds`).
 */
export function protectedProductIds(guides: Pick<Guide, "steps" | "products">[]): Set<string> {
  const ids = new Set(PLANNER_PRODUCT_IDS);
  for (const guide of guides) {
    for (const id of productIdsInGuide(guide)) ids.add(id);
  }
  return ids;
}

/** For the guides as written in lib/data/guides.ts: guest mode and tests */
export const PROTECTED_PRODUCT_IDS: ReadonlySet<string> = protectedProductIds(GUIDES);

export function isProtectedProduct(id: string): boolean {
  return PROTECTED_PRODUCT_IDS.has(id);
}
