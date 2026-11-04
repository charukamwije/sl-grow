"use server";

import { revalidatePath } from "next/cache";
import {
  audit,
  authorizeAction,
  type ActionResult,
} from "@/lib/supabase/admin-auth";
import { isRole } from "@/lib/supabase/roles";
import { RoleChangeError, setUserRole } from "@/lib/supabase/users";

/** Super admin only. The last super admin cannot be demoted (0002_roles.sql). */
export async function changeRole(
  targetUid: unknown,
  role: unknown
): Promise<ActionResult> {
  const auth = await authorizeAction("super_admin");
  if (!auth.user) return { ok: false, error: auth.error };
  const { user } = auth;

  if (typeof targetUid !== "string" || !targetUid || !isRole(role)) {
    return { ok: false, error: "Choose a user and a role." };
  }

  // Demoting yourself could lock you out of this page mid-task; another
  // super admin has to do it.
  if (targetUid === user.uid && role !== "super_admin") {
    return {
      ok: false,
      error: "You cannot remove your own super admin role. Ask another super admin.",
    };
  }

  try {
    await setUserRole(targetUid, role);
  } catch (changeError) {
    if (changeError instanceof RoleChangeError) {
      return { ok: false, error: changeError.message };
    }

    console.error("Role change error:", changeError);
    return { ok: false, error: "Failed to change the role." };
  }

  await audit(user, "user.role_changed", targetUid, { role });
  revalidatePath("/admin/users");

  return { ok: true };
}
