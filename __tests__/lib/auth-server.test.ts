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

const { getServerSession, getServerUser } = await import(
  "@/lib/supabase/auth-server"
);

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  supabaseDouble.reset();
  stubSupabaseEnv();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("getServerSession", () => {
  it("reads the profile Google gave Supabase", async () => {
    supabaseDouble.givenUser("user-1", {
      metadata: { full_name: "Example User", avatar_url: "https://example.com/a.png" },
    });

    await expect(getServerSession()).resolves.toEqual({
      state: "valid",
      user: {
        uid: "user-1",
        email: "user@example.com",
        displayName: "Example User",
        photoURL: "https://example.com/a.png",
        role: "member",
      },
    });
  });

  it("falls back to the OpenID claim names", async () => {
    supabaseDouble.givenUser("user-1", {
      metadata: { name: "Example", picture: "https://example.com/p.png" },
    });

    await expect(getServerSession()).resolves.toMatchObject({
      user: { displayName: "Example", photoURL: "https://example.com/p.png" },
    });
  });

  it("reads the role from the user's profile", async () => {
    supabaseDouble.givenUser("user-1", { role: "admin" });

    await expect(getServerSession()).resolves.toMatchObject({
      user: { role: "admin" },
    });
  });

  it("is unavailable when the role cannot be read", async () => {
    supabaseDouble.givenUser("user-1");
    vi.spyOn(supabaseDouble.admin, "from").mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: { message: "timeout" } }),
        }),
      }),
    } as never);

    await expect(getServerSession()).resolves.toEqual({ state: "unavailable" });
  });

  it("is invalid without a session", async () => {
    await expect(getServerSession()).resolves.toEqual({ state: "invalid" });
  });

  it("is invalid when the Auth server rejects the session", async () => {
    supabaseDouble.givenRejectedSession();

    await expect(getServerSession()).resolves.toEqual({ state: "invalid" });
  });

  it("is unavailable, not signed out, when the Auth server cannot answer", async () => {
    supabaseDouble.givenAuthOutage();

    await expect(getServerSession()).resolves.toEqual({ state: "unavailable" });
  });

  it("is invalid in guest mode without asking Supabase", async () => {
    vi.unstubAllEnvs();

    await expect(getServerSession()).resolves.toEqual({ state: "invalid" });
    expect(supabaseDouble.auth.getUser).not.toHaveBeenCalled();
  });
});

// The page-facing helper flattens every state to "user or nobody to render"
describe("getServerUser", () => {
  it("returns the user behind a valid session", async () => {
    supabaseDouble.givenUser("user-1");

    await expect(getServerUser()).resolves.toMatchObject({ uid: "user-1" });
  });

  it("returns null when Supabase cannot answer", async () => {
    supabaseDouble.givenAuthOutage();

    await expect(getServerUser()).resolves.toBeNull();
  });
});
