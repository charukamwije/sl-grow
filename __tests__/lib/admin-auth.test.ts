import { beforeEach, describe, expect, it, vi } from "vitest";
import { stubSupabaseEnv, supabaseDouble } from "../helpers/supabase-double";

vi.mock("@/lib/supabase/admin", async () => {
  const { supabaseDouble } = await import("../helpers/supabase-double");
  return { adminDb: supabaseDouble.admin };
});
vi.mock("@/lib/supabase/server", async () => {
  const { supabaseDouble } = await import("../helpers/supabase-double");
  return { createClient: async () => supabaseDouble.client };
});
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));

const { audit, authorizeAction, requireRole } = await import(
  "@/lib/supabase/admin-auth"
);

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  supabaseDouble.reset();
  stubSupabaseEnv();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("requireRole", () => {
  it("returns an admin for an admin page", async () => {
    supabaseDouble.givenUser("user-1", { role: "admin" });

    await expect(requireRole("admin")).resolves.toMatchObject({
      uid: "user-1",
      role: "admin",
    });
  });

  it("lets a super admin into admin pages", async () => {
    supabaseDouble.givenUser("user-1", { role: "super_admin" });

    await expect(requireRole("admin")).resolves.toMatchObject({ uid: "user-1" });
  });

  it.each([
    ["a member", "member", "admin"],
    ["an admin on a super admin page", "admin", "super_admin"],
  ] as const)("hides the page from %s", async (_, role, min) => {
    supabaseDouble.givenUser("user-1", { role });

    await expect(requireRole(min)).rejects.toThrow("NOT_FOUND");
  });

  it("hides the page from a guest", async () => {
    await expect(requireRole("admin")).rejects.toThrow("NOT_FOUND");
  });

  it("reports an outage instead of a missing page", async () => {
    supabaseDouble.givenAuthOutage();

    await expect(requireRole("admin")).rejects.toThrow(
      "Authentication is unavailable."
    );
  });

  it("treats a user without a profile as a member", async () => {
    supabaseDouble.givenUser("user-1");
    supabaseDouble.roles.clear();

    await expect(requireRole("admin")).rejects.toThrow("NOT_FOUND");
  });
});

describe("authorizeAction", () => {
  it("returns the user when the role is enough", async () => {
    supabaseDouble.givenUser("user-1", { role: "super_admin" });

    await expect(authorizeAction("super_admin")).resolves.toMatchObject({
      user: { uid: "user-1" },
    });
  });

  it("refuses a role that is not enough", async () => {
    supabaseDouble.givenUser("user-1", { role: "admin" });

    await expect(authorizeAction("super_admin")).resolves.toEqual({
      error: "You do not have permission to do that.",
    });
  });
});

describe("audit", () => {
  it("records who did what", async () => {
    supabaseDouble.givenUser("user-1", { role: "admin" });
    const { user } = await authorizeAction("admin");

    await audit(user!, "product.updated", "s_tomato", { price: 90 });

    expect(supabaseDouble.auditRows).toEqual([
      {
        actor_id: "user-1",
        action: "product.updated",
        target: "s_tomato",
        details: { price: 90 },
      },
    ]);
  });
});
