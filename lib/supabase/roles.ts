/**
 * The three roles, lowest first. Shared by server and client: the client uses
 * it only to decide what to show, never to decide what is allowed.
 */
export const ROLES = ["member", "admin", "super_admin"] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  member: "Member",
  admin: "Admin",
  super_admin: "Super admin",
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/** True when `role` is `min` or above */
export function hasRole(role: Role | null | undefined, min: Role): boolean {
  return role != null && ROLES.indexOf(role) >= ROLES.indexOf(min);
}
