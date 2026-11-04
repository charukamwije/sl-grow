"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getCatalog } from "@/lib/catalog-server";
import { GUIDE_ID_PATTERN, parseGuideInput, type GuideFormErrors } from "@/lib/guide-form";
import { isBuiltInGuide, productIdsInGuide } from "@/lib/guides";
import {
  createGuide,
  deleteGeneralGuide,
  DuplicateGuideError,
  getAdminGuide,
  GUIDES_TAG,
  updateGuide,
} from "@/lib/guides-server";
import { productCode } from "@/lib/products";
import { audit, authorizeAction, type ActionResult } from "@/lib/supabase/admin-auth";

export type GuideSaveResult = { errors?: GuideFormErrors; saved?: boolean };

// Readers, the shop's guide links and the protected-product check all read
// guides through this tag
function refresh(id?: string) {
  updateTag(GUIDES_TAG);
  revalidatePath("/guides");
  revalidatePath("/admin/guides");
  if (id) {
    revalidatePath(`/guides/${id}`);
    revalidatePath(`/admin/guides/${id}`);
  }
}

/**
 * Creates a general guide or updates any guide (admins and super admins).
 * `payload` is the editor's JSON. A built-in guide keeps its kind and
 * vegetable, and stays on show.
 */
export async function saveGuide(
  mode: "create" | "update",
  id: unknown,
  payload: unknown
): Promise<GuideSaveResult> {
  const auth = await authorizeAction("admin");
  if (!auth.user) return { errors: { form: auth.error } };
  const { user } = auth;

  if (typeof id !== "string" || typeof payload !== "string") {
    return { errors: { form: "The guide could not be read. Reload the page and try again." } };
  }

  let json: unknown;
  try {
    json = JSON.parse(payload);
  } catch {
    return { errors: { form: "The guide could not be read. Reload the page and try again." } };
  }

  const parsed = parseGuideInput(json);
  if (!parsed.input) return { errors: parsed.errors };
  const { input } = parsed;

  if (mode === "create") {
    if (!GUIDE_ID_PATTERN.test(id)) {
      return {
        errors: {
          id: "Use 2 to 40 lower-case letters, digits or hyphens, starting with a letter (e.g. balcony-herbs).",
        },
      };
    }
  } else {
    const existing = await getAdminGuide(id).catch((error) => {
      console.error("Guide load error:", error);
      return undefined;
    });
    if (existing === undefined) return { errors: { form: "Failed to save the guide." } };
    if (existing === null) return { errors: { form: "This guide no longer exists." } };

    if (!input.active && isBuiltInGuide(existing.kind)) {
      return {
        errors: {
          form: "The shop, planner and courses link to this guide, so it cannot be hidden.",
        },
      };
    }
  }

  // A guide on show must not name a product readers cannot find or buy
  if (input.active) {
    const catalog = await getCatalog();
    const missing = [...productIdsInGuide(input)].filter((productId) => !catalog.getProduct(productId));
    if (missing.length > 0) {
      return {
        errors: {
          products: `These products are hidden or do not exist: ${missing.map(productCode).join(", ")}. Remove them from the steps and the recommended list, or show them in the shop first.`,
        },
      };
    }
  }

  try {
    if (mode === "create") {
      await createGuide(id, input, user.uid);
    } else if (!(await updateGuide(id, input, user.uid))) {
      return { errors: { form: "This guide no longer exists." } };
    }
  } catch (error) {
    if (error instanceof DuplicateGuideError) return { errors: { id: error.message } };
    console.error("Guide save error:", error);
    return { errors: { form: "Failed to save the guide." } };
  }

  await audit(user, mode === "create" ? "guide.created" : "guide.updated", id, {
    steps: input.steps.length,
    active: input.active,
  });
  refresh(id);

  if (mode === "create") redirect(`/admin/guides/${id}?created=1`);

  return { saved: true };
}

/** Deletes a general guide for good (admins and super admins) */
export async function removeGuide(id: unknown): Promise<ActionResult> {
  const auth = await authorizeAction("admin");
  if (!auth.user) return { ok: false, error: auth.error };

  if (typeof id !== "string" || !id) return { ok: false, error: "Choose a guide." };

  try {
    // Only matches a general guide, so a built-in one cannot be deleted
    if (!(await deleteGeneralGuide(id))) {
      return {
        ok: false,
        error: "Only guides added in the console can be deleted. Built-in guides can be edited instead.",
      };
    }
  } catch (error) {
    console.error("Guide delete error:", error);
    return { ok: false, error: "Failed to delete the guide." };
  }

  await audit(auth.user, "guide.deleted", id);
  refresh(id);

  return { ok: true };
}
