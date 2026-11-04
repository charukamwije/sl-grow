// Fails the build if this module is ever pulled into a client bundle
import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { adminDb } from "./admin";
import { isSupabaseConfigured } from "./config";
import { isRejectedSessionError } from "./errors";
import { isRole, type Role } from "./roles";
import { createClient } from "./server";
import { SESSION_COOKIE_PREFIX } from "./session";

export type ServerUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: Role;
};

/**
 * A missing or rejected session is the caller's problem and can be cleared,
 * while a Supabase outage must not be reported as "signed out" - the two need
 * different answers, so they are kept apart here.
 */
export type ServerSession =
  | { state: "valid"; user: ServerUser }
  | { state: "invalid" }
  | { state: "unavailable" };

function text(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

/**
 * The user's role, from `profiles`. A missing row - a user from before the
 * roles migration that the backfill missed - is a member. A failed lookup
 * throws: answering "member" would quietly lock admins out during an outage,
 * and answering anything higher would be worse.
 */
async function loadRole(uid: string): Promise<Role> {
  const { data, error } = await adminDb
    .from("profiles")
    .select("role")
    .eq("user_id", uid)
    .maybeSingle<{ role: string }>();

  if (error) {
    throw new Error(`Failed to load the role: ${error.message}`);
  }

  return isRole(data?.role) ? data.role : "member";
}

// Once per request: the layout, the page and the route guards all ask
export const getServerSession = cache(async (): Promise<ServerSession> => {
  // Guest mode (FR-A-10): nobody can have signed in
  if (!isSupabaseConfigured()) {
    return { state: "invalid" };
  }

  // `getUser` asks the Auth server rather than trusting the cookie's JWT, so
  // a session revoked by signing out elsewhere is rejected straight away.
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    if (error && !isRejectedSessionError(error)) {
      console.error("Server-side auth error:", error);
      return { state: "unavailable" };
    }

    return { state: "invalid" };
  }

  const { user } = data;
  const metadata = user.user_metadata ?? {};

  let role: Role;
  try {
    role = await loadRole(user.id);
  } catch (error) {
    console.error("Server-side role error:", error);
    return { state: "unavailable" };
  }

  return {
    state: "valid",
    user: {
      uid: user.id,
      email: user.email ?? null,
      displayName: text(metadata.full_name) ?? text(metadata.name),
      photoURL: text(metadata.avatar_url) ?? text(metadata.picture),
      role,
    },
  };
});

/**
 * The current user, or null when there is nobody to render - for pages, which
 * have to show something either way.
 */
export async function getServerUser(): Promise<ServerUser | null> {
  const session = await getServerSession();

  return session.state === "valid" ? session.user : null;
}

/**
 * Drops every Supabase cookie from this browser. For a session that is gone
 * or rejected, where the SDK's own sign-out has nothing left to revoke.
 */
export async function clearSessionCookies(): Promise<void> {
  const cookieStore = await cookies();

  for (const { name } of cookieStore.getAll()) {
    if (name.startsWith(SESSION_COOKIE_PREFIX)) {
      cookieStore.delete(name);
    }
  }
}
