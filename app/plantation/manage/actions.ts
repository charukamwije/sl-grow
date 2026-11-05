"use server";

import { revalidatePath } from "next/cache";
import {
  deletePlantation,
  deleteRecord,
  getPlantation,
  insertPlantation,
  insertRecord,
  isPlantationWorker,
  payWorker,
  updatePlantation,
  updateRecord,
} from "@/lib/plantation-server";
import { checkRecord, isRecordKind, type RecordKind } from "@/lib/plantation/records";
import { getServerSession } from "@/lib/supabase/auth-server";

export type RecordResult =
  | { ok: true; id?: string }
  | { ok: false; error?: string; errors?: Record<string, string> };

const SIGNED_OUT = "Please sign in again to save your plantation records.";
const NOT_FOUND = "This plantation or record no longer exists.";
const FAILED = "Saving failed. Please try again.";

async function sessionUid(): Promise<string | null> {
  const session = await getServerSession();
  return session.state === "valid" ? session.user.uid : null;
}

function refresh(plantationId?: string) {
  revalidatePath("/plantation/manage");
  if (plantationId) revalidatePath(`/plantation/manage/${plantationId}`);
}

/** Adds a plantation, or changes one (`id`); answers the plantation's id */
export async function savePlantation(id: string | null, input: Record<string, unknown>): Promise<RecordResult> {
  const uid = await sessionUid();
  if (!uid) return { ok: false, error: SIGNED_OUT };

  const existing = id ? await getPlantation(uid, id) : null;
  if (id && !existing) return { ok: false, error: NOT_FOUND };

  const checked = checkRecord("plantation", input, existing?.crop ?? null);
  if (!checked.ok) return { ok: false, errors: checked.errors };

  try {
    if (existing) {
      if (!(await updatePlantation(uid, existing.id, checked.values))) return { ok: false, error: NOT_FOUND };
      refresh(existing.id);
      return { ok: true, id: existing.id };
    }
    const newId = await insertPlantation(uid, checked.values);
    refresh();
    return { ok: true, id: newId };
  } catch (error) {
    console.error("Plantation save error:", error);
    return { ok: false, error: FAILED };
  }
}

export async function removePlantation(id: string): Promise<RecordResult> {
  const uid = await sessionUid();
  if (!uid) return { ok: false, error: SIGNED_OUT };

  try {
    if (!(await deletePlantation(uid, id))) return { ok: false, error: NOT_FOUND };
  } catch (error) {
    console.error("Plantation delete error:", error);
    return { ok: false, error: "Deleting failed. Please try again." };
  }
  refresh(id);
  return { ok: true };
}

type ChildKind = Exclude<RecordKind, "plantation">;

// Actions are callable with anything, whatever their types say
const isChildKind = (kind: unknown): kind is ChildKind => isRecordKind(kind) && kind !== "plantation";

/** Adds a record to one of the planter's plantations, or changes one (`id`) */
export async function saveRecord(
  plantationId: string,
  kind: ChildKind,
  id: string | null,
  input: Record<string, unknown>
): Promise<RecordResult> {
  if (!isChildKind(kind)) return { ok: false, error: FAILED };

  const uid = await sessionUid();
  if (!uid) return { ok: false, error: SIGNED_OUT };

  try {
    const plantation = await getPlantation(uid, plantationId);
    if (!plantation) return { ok: false, error: NOT_FOUND };

    const checked = checkRecord(kind, input, plantation.crop);
    if (!checked.ok) return { ok: false, errors: checked.errors };

    if (kind === "workday" && !(await isPlantationWorker(uid, plantation.id, String(checked.values.worker_id)))) {
      return { ok: false, errors: { worker_id: "Choose a worker of this plantation." } };
    }

    if (id) {
      if (!(await updateRecord(uid, plantation.id, kind, id, checked.values))) {
        return { ok: false, error: NOT_FOUND };
      }
      refresh(plantation.id);
      return { ok: true, id };
    }

    const newId = await insertRecord(uid, plantation.id, kind, checked.values);
    refresh(plantation.id);
    return { ok: true, id: newId };
  } catch (error) {
    console.error("Plantation record save error:", error);
    return { ok: false, error: FAILED };
  }
}

export async function removeRecord(plantationId: string, kind: ChildKind, id: string): Promise<RecordResult> {
  if (!isChildKind(kind)) return { ok: false, error: FAILED };

  const uid = await sessionUid();
  if (!uid) return { ok: false, error: SIGNED_OUT };

  try {
    if (!(await deleteRecord(uid, plantationId, kind, id))) return { ok: false, error: NOT_FOUND };
  } catch (error) {
    console.error("Plantation record delete error:", error);
    return { ok: false, error: "Deleting failed. Please try again." };
  }
  refresh(plantationId);
  return { ok: true };
}

/** Marks all of a worker's unpaid days paid */
export async function settleWorker(plantationId: string, workerId: string): Promise<RecordResult> {
  const uid = await sessionUid();
  if (!uid) return { ok: false, error: SIGNED_OUT };

  try {
    await payWorker(uid, plantationId, workerId);
  } catch (error) {
    console.error("Worker pay error:", error);
    return { ok: false, error: FAILED };
  }
  refresh(plantationId);
  return { ok: true };
}
