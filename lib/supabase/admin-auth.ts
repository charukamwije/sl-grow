// Fails the build if this module is ever pulled into a client bundle
import "server-only";
import { notFound } from "next/navigation";
import { adminDb } from "./admin";
import { getServerSession, type ServerUser } from "./auth-server";
import { hasRole, type Role } from "./roles";

/**
 * For admin pages: the signed-in user if they hold `min` or above, otherwise
 * a 404. Not a 403 - the console should not announce itself to members.
 *
 * Every page and action checks for itself. The admin layout checking first
 * is a convenience, not the protection: Server Actions can be called without
 * ever rendering the layout.
 */
export async function requireRole(min: Role): Promise<ServerUser> {
  const session = await getServerSession();

  if (session.state === "unavailable") {
    // An outage is not a reason to pretend the page does not exist
    throw new Error("Authentication is unavailable.");
  }

  if (session.state === "invalid" || !hasRole(session.user.role, min)) {
    notFound();
  }

  return session.user;
}

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * For Server Actions: the user if they hold `min` or above, or the error to
 * answer with. Actions return errors instead of throwing so the form can
 * show them.
 */
export async function authorizeAction(
  min: Role
): Promise<{ user: ServerUser; error?: never } | { user?: never; error: string }> {
  const session = await getServerSession();

  if (session.state === "unavailable") {
    return { error: "Authentication is unavailable. Please try again." };
  }

  if (session.state === "invalid" || !hasRole(session.user.role, min)) {
    return { error: "You do not have permission to do that." };
  }

  return { user: session.user };
}

/**
 * Records an admin change. A failed write is logged rather than thrown: the
 * change itself already happened, and reporting it as failed would invite a
 * retry of something that succeeded.
 */
export async function audit(
  actor: ServerUser,
  action: string,
  target: string | null,
  details: Record<string, unknown> = {}
): Promise<void> {
  const { error } = await adminDb
    .from("audit_log")
    .insert({ actor_id: actor.uid, action, target, details });

  if (error) {
    console.error("Audit log error:", error, { action, target });
  }
}
