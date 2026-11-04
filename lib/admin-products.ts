// Fails the build if this module is ever pulled into a client bundle
import "server-only";
import {
  PRODUCT_COLUMNS,
  PRODUCT_IMAGE_BUCKET,
  productImageUrl,
  type ProductRow,
} from "./catalog-server";
import type { ProductInput } from "./product-form";
import { adminDb } from "./supabase/admin";
import { DatabaseError } from "./supabase/store";

/** A product as the admin pages show it, hidden ones included */
export type AdminProduct = Omit<ProductInput, "price"> & {
  price: number;
  imagePath: string | null;
  imageUrl: string | null;
  sortOrder: number;
};

function toAdminProduct(row: ProductRow): AdminProduct {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    unit: row.unit,
    icon: row.icon,
    price: Number(row.price),
    vegId: row.veg_id,
    active: row.active,
    imagePath: row.image_path,
    imageUrl: row.image_path ? productImageUrl(row.image_path) : null,
    sortOrder: row.sort_order,
  };
}

function fail(error: { message: string; code?: string }, status: number): never {
  throw new DatabaseError(error.message, error.code ?? "", status);
}

export async function listAdminProducts(): Promise<AdminProduct[]> {
  const { data, error, status } = await adminDb
    .from("products")
    .select(PRODUCT_COLUMNS)
    .order("sort_order")
    .order("id")
    .overrideTypes<ProductRow[], { merge: false }>();

  if (error) fail(error, status);
  return data.map(toAdminProduct);
}

export async function getAdminProduct(id: string): Promise<AdminProduct | null> {
  const { data, error, status } = await adminDb
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("id", id)
    .maybeSingle<ProductRow>();

  if (error) fail(error, status);
  return data ? toAdminProduct(data) : null;
}

function columns(input: ProductInput, actorId: string) {
  return {
    category: input.category,
    name: input.name,
    unit: input.unit,
    icon: input.icon,
    price: input.price,
    veg_id: input.vegId,
    active: input.active,
    updated_at: new Date().toISOString(),
    updated_by: actorId,
  };
}

/** Thrown when a new product's ID is already taken */
export class DuplicateProductError extends Error {}

/** New products go to the end of the shop's order */
export async function createProduct(input: ProductInput, actorId: string): Promise<void> {
  const last = await adminDb
    .from("products")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle<{ sort_order: number }>();

  if (last.error) fail(last.error, last.status);

  const { error, status } = await adminDb.from("products").insert({
    id: input.id,
    ...columns(input, actorId),
    sort_order: (last.data?.sort_order ?? 0) + 10,
  });

  if (error?.code === "23505") {
    throw new DuplicateProductError(`A product with the ID ${input.id} already exists.`);
  }
  if (error) fail(error, status);
}

/** Returns false when there is no such product */
export async function updateProduct(input: ProductInput, actorId: string): Promise<boolean> {
  const { data, error, status } = await adminDb
    .from("products")
    .update(columns(input, actorId))
    .eq("id", input.id)
    .select("id");

  if (error) fail(error, status);
  return (data ?? []).length > 0;
}

/** Deletes the product and its photo; returns false when there was none */
export async function deleteProduct(id: string): Promise<boolean> {
  const { data, error, status } = await adminDb
    .from("products")
    .delete()
    .eq("id", id)
    .select("image_path");

  if (error) fail(error, status);

  const rows = (data ?? []) as { image_path: string | null }[];
  const paths = rows.map((row) => row.image_path).filter((path): path is string => !!path);
  if (paths.length > 0) await removeImages(paths);

  return rows.length > 0;
}

/**
 * Stores a new photo under a fresh name, points the product at it, then
 * removes the old one. A fresh name every time means no browser or CDN can
 * keep showing the previous photo from its cache.
 */
export async function replaceProductImage(
  id: string,
  bytes: Uint8Array,
  type: string,
  ext: string,
  actorId: string
): Promise<void> {
  const current = await getAdminProduct(id);
  if (!current) throw new Error(`No product ${id}`);

  const path = `${id}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const upload = await adminDb.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(path, bytes, { contentType: type, cacheControl: "31536000", upsert: false });

  if (upload.error) throw new Error(`Photo upload failed: ${upload.error.message}`);

  const { error, status } = await adminDb
    .from("products")
    .update({ image_path: path, updated_at: new Date().toISOString(), updated_by: actorId })
    .eq("id", id);

  if (error) {
    await removeImages([path]);
    fail(error, status);
  }

  if (current.imagePath) await removeImages([current.imagePath]);
}

export async function clearProductImage(id: string, actorId: string): Promise<void> {
  const current = await getAdminProduct(id);
  if (!current?.imagePath) return;

  const { error, status } = await adminDb
    .from("products")
    .update({ image_path: null, updated_at: new Date().toISOString(), updated_by: actorId })
    .eq("id", id);

  if (error) fail(error, status);
  await removeImages([current.imagePath]);
}

// A leftover file costs storage, not correctness, so it is logged, not thrown
async function removeImages(paths: string[]): Promise<void> {
  const { error } = await adminDb.storage.from(PRODUCT_IMAGE_BUCKET).remove(paths);
  if (error) console.error("Product photo removal error:", error, paths);
}
