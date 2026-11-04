// Fails the build if this module is ever pulled into a client bundle
import "server-only";
import { adminDb } from "./admin";
import { isRole, type Role } from "./roles";
import { DatabaseError } from "./store";

export const USERS_PER_PAGE = 50;

export type AdminUserRow = {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: Role;
  createdAt: string;
  lastSignInAt: string | null;
};

/**
 * One page of users for the Users page: accounts from Supabase Auth, roles
 * from `profiles`. `hasMore` is a guess from a full page, which is all the
 * Auth admin API offers without counting every user.
 */
export async function listUsers(
  page: number
): Promise<{ users: AdminUserRow[]; hasMore: boolean }> {
  const { data, error } = await adminDb.auth.admin.listUsers({
    page,
    perPage: USERS_PER_PAGE,
  });

  if (error) {
    throw new Error(`Failed to list users: ${error.message}`);
  }

  const ids = data.users.map((user) => user.id);
  const roles = new Map<string, Role>();

  if (ids.length > 0) {
    const result = await adminDb
      .from("profiles")
      .select("user_id, role")
      .in("user_id", ids)
      .overrideTypes<{ user_id: string; role: string }[], { merge: false }>();

    if (result.error) {
      throw new DatabaseError(
        result.error.message,
        result.error.code ?? "",
        result.status
      );
    }

    for (const row of result.data) {
      if (isRole(row.role)) roles.set(row.user_id, row.role);
    }
  }

  const users = data.users.map((user) => {
    const metadata = user.user_metadata ?? {};
    const name = metadata.full_name ?? metadata.name;

    return {
      uid: user.id,
      email: user.email ?? null,
      displayName: typeof name === "string" && name ? name : null,
      role: roles.get(user.id) ?? "member",
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at ?? null,
    };
  });

  return { users, hasMore: data.users.length === USERS_PER_PAGE };
}

/** Thrown by `setUserRole` for a refusal worth showing to the admin */
export class RoleChangeError extends Error {}

/**
 * Changes a role through the database function, which refuses to demote the
 * last super admin under a lock (see 0002_roles.sql).
 */
export async function setUserRole(uid: string, role: Role): Promise<void> {
  const { error } = await adminDb.rpc("set_user_role", {
    p_target: uid,
    p_role: role,
  });

  if (!error) return;

  if (error.hint === "last_super_admin") {
    throw new RoleChangeError(
      "There must always be at least one super admin. Make someone else a super admin first."
    );
  }

  if (error.code === "P0002") {
    throw new RoleChangeError("That user no longer exists.");
  }

  throw new Error(`Failed to change the role: ${error.message}`);
}

/** How many super admins there are, for the account deletion guard */
export async function countSuperAdmins(): Promise<number> {
  const { count, error, status } = await adminDb
    .from("profiles")
    .select("user_id", { count: "exact", head: true })
    .eq("role", "super_admin");

  if (error) throw new DatabaseError(error.message, error.code ?? "", status);

  return count ?? 0;
}
