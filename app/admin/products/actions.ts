"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearProductImage,
  createProduct,
  deleteProduct,
  DuplicateProductError,
  getAdminProduct,
  replaceProductImage,
  updateProduct,
} from "@/lib/admin-products";
import { CATALOG_TAG } from "@/lib/catalog-server";
import {
  checkImage,
  parseProductForm,
  type ProductFormErrors,
} from "@/lib/product-form";
import { getProtectedProductIds } from "@/lib/guides-server";
import {
  audit,
  authorizeAction,
  type ActionResult,
} from "@/lib/supabase/admin-auth";

export type ProductFormState = { errors?: ProductFormErrors; saved?: boolean };

// The shop, cart and planner read the catalogue through this tag
function refresh(id?: string) {
  updateTag(CATALOG_TAG);
  revalidatePath("/admin/products");
  if (id) revalidatePath(`/admin/products/${id}`);
}

/**
 * Creates or updates a product (admins and super admins). `mode` comes from
 * which page the form is on; the ID of an existing product is never changed.
 */
export async function saveProduct(
  mode: "create" | "update",
  _previous: ProductFormState,
  form: FormData
): Promise<ProductFormState> {
  const auth = await authorizeAction("admin");
  if (!auth.user) return { errors: { form: auth.error } };
  const { user } = auth;

  const parsed = parseProductForm(form);
  if (!parsed.input) return { errors: parsed.errors };
  const { input } = parsed;

  if (!input.active && (await getProtectedProductIds()).has(input.id)) {
    return {
      errors: {
        active:
          "The planner or a grow guide uses this product, so it cannot be hidden. You can still change its price, names and photo.",
      },
    };
  }

  try {
    if (mode === "create") {
      await createProduct(input, user.uid);
    } else if (!(await updateProduct(input, user.uid))) {
      return { errors: { form: "This product no longer exists." } };
    }
  } catch (error) {
    if (error instanceof DuplicateProductError) {
      return { errors: { id: error.message } };
    }
    console.error("Product save error:", error);
    return { errors: { form: "Failed to save the product." } };
  }

  await audit(user, mode === "create" ? "product.created" : "product.updated", input.id, {
    price: input.price,
    active: input.active,
  });
  refresh(input.id);

  if (mode === "create") {
    redirect(`/admin/products/${input.id}?created=1`);
  }

  return { saved: true };
}

/** Deletes a product for good (admins and super admins). Orders keep their copy. */
export async function removeProduct(id: unknown): Promise<ActionResult> {
  const auth = await authorizeAction("admin");
  if (!auth.user) return { ok: false, error: auth.error };

  if (typeof id !== "string" || !id) {
    return { ok: false, error: "Choose a product." };
  }

  if ((await getProtectedProductIds()).has(id)) {
    return {
      ok: false,
      error: "The planner or a grow guide uses this product, so it cannot be deleted.",
    };
  }

  try {
    if (!(await deleteProduct(id))) {
      return { ok: false, error: "This product no longer exists." };
    }
  } catch (error) {
    console.error("Product delete error:", error);
    return { ok: false, error: "Failed to delete the product." };
  }

  await audit(auth.user, "product.deleted", id);
  refresh();

  return { ok: true };
}

/** Replaces a product's photo (admins and super admins) */
export async function uploadProductImage(
  id: string,
  _previous: ActionResult | null,
  form: FormData
): Promise<ActionResult> {
  const auth = await authorizeAction("admin");
  if (!auth.user) return { ok: false, error: auth.error };

  const file = form.get("image");
  if (!(file instanceof File)) {
    return { ok: false, error: "Choose a photo to upload." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const image = checkImage(bytes);
  if (image.error !== undefined) return { ok: false, error: image.error };

  try {
    if (!(await getAdminProduct(id))) {
      return { ok: false, error: "This product no longer exists." };
    }
    await replaceProductImage(id, bytes, image.type, image.ext, auth.user.uid);
  } catch (error) {
    console.error("Product photo upload error:", error);
    return { ok: false, error: "Failed to upload the photo." };
  }

  await audit(auth.user, "product.image_uploaded", id, { bytes: bytes.length });
  refresh(id);

  return { ok: true };
}

/** Removes a product's photo, so the shop shows its emoji again */
export async function deleteProductImage(id: unknown): Promise<ActionResult> {
  const auth = await authorizeAction("admin");
  if (!auth.user) return { ok: false, error: auth.error };

  if (typeof id !== "string" || !id) {
    return { ok: false, error: "Choose a product." };
  }

  try {
    await clearProductImage(id, auth.user.uid);
  } catch (error) {
    console.error("Product photo removal error:", error);
    return { ok: false, error: "Failed to remove the photo." };
  }

  await audit(auth.user, "product.image_removed", id);
  refresh(id);

  return { ok: true };
}
