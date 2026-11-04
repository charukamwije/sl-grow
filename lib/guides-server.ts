// Fails the build if this module is ever pulled into a client bundle
import "server-only";
import { unstable_cache } from "next/cache";
import { GUIDES, type Guide, type GuideKind, type GuideStep } from "./data/guides";
import type { GuideInput } from "./guide-form";
import type { Localized } from "./i18n/types";
import { protectedProductIds } from "./protected-products";
import { adminDb } from "./supabase/admin";
import { isSupabaseConfigured } from "./supabase/config";
import { DatabaseError } from "./supabase/store";

/** Revalidated by every admin change to guides */
export const GUIDES_TAG = "guides";

type GuideRow = {
  id: string;
  kind: GuideKind;
  icon: string;
  name: Localized;
  time: Localized | null;
  veg_id: string | null;
  steps: GuideStep[];
  products: string[];
  active: boolean;
  sort_order: number;
};

const COLUMNS = "id, kind, icon, name, time, veg_id, steps, products, active, sort_order";

/** A guide as the admin pages show it, hidden ones included */
export type AdminGuide = Guide & { active: boolean; sortOrder: number };

function fromRow(row: GuideRow): AdminGuide {
  return {
    id: row.id,
    kind: row.kind,
    icon: row.icon,
    name: row.name,
    ...(row.time ? { time: row.time } : {}),
    ...(row.veg_id ? { vegId: row.veg_id } : {}),
    steps: row.steps,
    products: row.products,
    active: row.active,
    sortOrder: row.sort_order,
  };
}

function fail(error: { message: string; code?: string }, status: number): never {
  throw new DatabaseError(error.message, error.code ?? "", status);
}

async function queryGuides(activeOnly: boolean): Promise<AdminGuide[]> {
  let query = adminDb.from("guides").select(COLUMNS);
  if (activeOnly) query = query.eq("active", true);

  const { data, error, status } = await query
    .order("sort_order")
    .order("id")
    .overrideTypes<GuideRow[], { merge: false }>();

  if (error) fail(error, status);
  return data.map(fromRow);
}

// Shared by every request until an admin change revalidates the tag
const loadActiveGuides = unstable_cache(() => queryGuides(true), ["guides-active"], {
  tags: [GUIDES_TAG],
});

/**
 * The guides readers see, in order. In guest mode, the guides written in
 * lib/data/guides.ts. A failed query throws rather than showing stale text.
 */
export async function getGuides(): Promise<Guide[]> {
  if (!isSupabaseConfigured()) return GUIDES;
  return loadActiveGuides();
}

export async function getGuide(id: string): Promise<Guide | undefined> {
  return (await getGuides()).find((guide) => guide.id === id);
}

/**
 * Products that may not be hidden or deleted: the planner's, and every one a
 * guide on show recommends or names. A hidden guide protects nothing; it is
 * checked again when it is shown (see the guide actions).
 */
export async function getProtectedProductIds(): Promise<Set<string>> {
  return protectedProductIds(await getGuides());
}

export async function listAdminGuides(): Promise<AdminGuide[]> {
  return queryGuides(false);
}

export async function getAdminGuide(id: string): Promise<AdminGuide | null> {
  const { data, error, status } = await adminDb
    .from("guides")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle<GuideRow>();

  if (error) fail(error, status);
  return data ? fromRow(data) : null;
}

function columns(input: GuideInput, actorId: string) {
  return {
    name: input.name,
    icon: input.icon,
    time: input.time,
    steps: input.steps,
    products: input.products,
    active: input.active,
    updated_at: new Date().toISOString(),
    updated_by: actorId,
  };
}

/** Returns false when there is no such guide */
export async function updateGuide(id: string, input: GuideInput, actorId: string): Promise<boolean> {
  const { data, error, status } = await adminDb
    .from("guides")
    .update(columns(input, actorId))
    .eq("id", id)
    .select("id");

  if (error) fail(error, status);
  return (data ?? []).length > 0;
}

/** Thrown when a new guide's ID is already taken */
export class DuplicateGuideError extends Error {}

/** New guides are general ones, listed after the others */
export async function createGuide(id: string, input: GuideInput, actorId: string): Promise<void> {
  const last = await adminDb
    .from("guides")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle<{ sort_order: number }>();

  if (last.error) fail(last.error, last.status);

  const { error, status } = await adminDb.from("guides").insert({
    id,
    kind: "general",
    ...columns(input, actorId),
    sort_order: (last.data?.sort_order ?? 0) + 10,
  });

  if (error?.code === "23505") {
    throw new DuplicateGuideError(`A guide with the ID ${id} already exists.`);
  }
  if (error) fail(error, status);
}

/** Only general guides can be deleted; returns false when there was none */
export async function deleteGeneralGuide(id: string): Promise<boolean> {
  const { data, error, status } = await adminDb
    .from("guides")
    .delete()
    .eq("id", id)
    .eq("kind", "general")
    .select("id");

  if (error) fail(error, status);
  return (data ?? []).length > 0;
}
