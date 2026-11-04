"use server";

import { revalidatePath } from "next/cache";
import { isCertStatus, parseExpiry } from "@/lib/certification/status";
import { updateApplicationStatus } from "@/lib/certifications-server";
import { audit, authorizeAction, type ActionResult } from "@/lib/supabase/admin-auth";

const MAX_NOTE = 1000;

/**
 * Decides on an application (admins and super admins). Certifying needs an
 * expiry date; the note, if any, is shown to the applicant.
 */
export async function setApplicationStatus(
  id: unknown,
  status: unknown,
  note: unknown,
  expiry: unknown
): Promise<ActionResult> {
  const auth = await authorizeAction("admin");
  if (!auth.user) return { ok: false, error: auth.error };

  if (typeof id !== "string" || !id || !isCertStatus(status)) {
    return { ok: false, error: "Choose an application and a status." };
  }

  const text = typeof note === "string" ? note.trim() : "";
  if (text.length > MAX_NOTE) {
    return { ok: false, error: `Keep the note under ${MAX_NOTE} characters.` };
  }

  let expiresAt: string | null = null;
  if (status === "certified") {
    expiresAt = parseExpiry(expiry);
    if (!expiresAt) {
      return { ok: false, error: "Choose an expiry date after today and within 10 years." };
    }
  }

  try {
    if (!(await updateApplicationStatus(id, { status, note: text, expiresAt }, auth.user.uid))) {
      return { ok: false, error: "This application no longer exists." };
    }
  } catch (error) {
    console.error("Application status error:", error);
    return { ok: false, error: "Failed to change the status." };
  }

  await audit(auth.user, "certification.status_changed", id, {
    status,
    ...(expiresAt ? { expiresAt } : {}),
  });

  revalidatePath("/admin/certifications");
  revalidatePath(`/admin/certifications/${id}`);
  revalidatePath("/admin");
  revalidatePath("/account");
  revalidatePath("/join");

  return { ok: true };
}
