// Fails the build if this module is ever pulled into a client bundle
import "server-only";
import { unstable_cache } from "next/cache";
import {
  PRODUCTS,
  type Category,
  type Product,
  type Unit,
} from "./data/products";
import type { Localized } from "./i18n/types";
import { createCatalog, type Catalog } from "./products";
import { adminDb } from "./supabase/admin";
import { isSupabaseConfigured } from "./supabase/config";
import { DatabaseError } from "./supabase/store";

/** Revalidated by every admin change to products */
export const CATALOG_TAG = "catalog";

export const PRODUCT_IMAGE_BUCKET = "product-images";

export type ProductRow = {
  id: string;
  category: Category;
  name: Localized;
  unit: Unit;
  icon: string;
  image_path: string | null;
  price: number | string;
  veg_id: string | null;
  active: boolean;
  sort_order: number;
};

export const PRODUCT_COLUMNS =
  "id, category, name, unit, icon, image_path, price, veg_id, active, sort_order";

/** The public URL of a stored product photo */
export function productImageUrl(path: string): string {
  return `${process.env.SUPABASE_URL}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${path}`;
}

export function productFromRow(row: ProductRow): Product {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    unit: row.unit,
    icon: row.icon,
    price: Number(row.price),
    ...(row.veg_id ? { vegId: row.veg_id } : {}),
    ...(row.image_path ? { image: productImageUrl(row.image_path) } : {}),
  };
}

// Shared by every request until an admin change revalidates the tag
const loadActiveProducts = unstable_cache(
  async (): Promise<Product[]> => {
    const { data, error, status } = await adminDb
      .from("products")
      .select(PRODUCT_COLUMNS)
      .eq("active", true)
      .order("sort_order")
      .order("id")
      .overrideTypes<ProductRow[], { merge: false }>();

    if (error) throw new DatabaseError(error.message, error.code ?? "", status);

    return data.map(productFromRow);
  },
  ["catalog-active-products"],
  { tags: [CATALOG_TAG] }
);

/**
 * The products on sale. In guest mode, the catalogue written in
 * lib/data/products.ts. A failed query throws: falling back to the static
 * prices would quietly take orders at prices the shop has changed.
 */
export async function getCatalogProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return PRODUCTS;
  }

  return loadActiveProducts();
}

export async function getCatalog(): Promise<Catalog> {
  return createCatalog(await getCatalogProducts());
}
