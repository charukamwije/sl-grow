import { beforeEach, describe, expect, it, vi } from "vitest";
import { stubSupabaseEnv, supabaseDouble } from "../helpers/supabase-double";

const users = vi.hoisted(() => ({ setUserRole: vi.fn() }));

vi.mock("@/lib/supabase/admin", async () => {
  const { supabaseDouble } = await import("../helpers/supabase-double");
  return { adminDb: supabaseDouble.admin };
});
vi.mock("@/lib/supabase/server", async () => {
  const { supabaseDouble } = await import("../helpers/supabase-double");
  return { createClient: async () => supabaseDouble.client };
});
vi.mock("@/lib/supabase/users", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  setUserRole: users.setUserRole,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { changeRole } = await import("@/app/admin/users/actions");
const { RoleChangeError } = await import("@/lib/supabase/users");

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  supabaseDouble.reset();
  stubSupabaseEnv();
  vi.spyOn(console, "error").mockImplementation(() => {});
  users.setUserRole.mockResolvedValue(undefined);
});

describe("changeRole", () => {
  it("lets a super admin promote someone and records it", async () => {
    supabaseDouble.givenUser("boss", { role: "super_admin" });

    await expect(changeRole("user-2", "admin")).resolves.toEqual({ ok: true });

    expect(users.setUserRole).toHaveBeenCalledWith("user-2", "admin");
    expect(supabaseDouble.auditRows).toEqual([
      expect.objectContaining({
        actor_id: "boss",
        action: "user.role_changed",
        target: "user-2",
        details: { role: "admin" },
      }),
    ]);
  });

  it.each(["member", "admin"] as const)("refuses a %s", async (role) => {
    supabaseDouble.givenUser("user-1", { role });

    await expect(changeRole("user-1", "super_admin")).resolves.toEqual({
      ok: false,
      error: "You do not have permission to do that.",
    });
    expect(users.setUserRole).not.toHaveBeenCalled();
  });

  it("refuses a guest", async () => {
    await expect(changeRole("user-2", "admin")).resolves.toMatchObject({ ok: false });
    expect(users.setUserRole).not.toHaveBeenCalled();
  });

  it("does not let a super admin demote themselves", async () => {
    supabaseDouble.givenUser("boss", { role: "super_admin" });

    const result = await changeRole("boss", "admin");

    expect(result).toMatchObject({ ok: false });
    expect(users.setUserRole).not.toHaveBeenCalled();
  });

  it("refuses an unknown role", async () => {
    supabaseDouble.givenUser("boss", { role: "super_admin" });

    await expect(changeRole("user-2", "owner")).resolves.toEqual({
      ok: false,
      error: "Choose a user and a role.",
    });
  });

  it("passes on the database's refusal to demote the last super admin", async () => {
    supabaseDouble.givenUser("boss", { role: "super_admin" });
    users.setUserRole.mockRejectedValue(new RoleChangeError("There must always be at least one super admin."));

    await expect(changeRole("user-2", "member")).resolves.toEqual({
      ok: false,
      error: "There must always be at least one super admin.",
    });
    expect(supabaseDouble.auditRows).toEqual([]);
  });

  it("hides other failures behind a generic message", async () => {
    supabaseDouble.givenUser("boss", { role: "super_admin" });
    users.setUserRole.mockRejectedValue(new Error("connection reset"));

    await expect(changeRole("user-2", "member")).resolves.toEqual({
      ok: false,
      error: "Failed to change the role.",
    });
  });
});
