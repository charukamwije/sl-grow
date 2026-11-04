import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cookieJar } from "../helpers/cookie-jar";
import { stubSupabaseEnv, supabaseDouble } from "../helpers/supabase-double";

vi.mock("@/lib/supabase/server", async () => {
  const { supabaseDouble } = await import("../helpers/supabase-double");
  return { createClient: async () => supabaseDouble.client };
});
vi.mock("@/lib/supabase/admin", async () => {
  const { supabaseDouble } = await import("../helpers/supabase-double");
  return { adminDb: supabaseDouble.admin };
});
const users = vi.hoisted(() => ({ countSuperAdmins: vi.fn() }));
vi.mock("@/lib/supabase/users", () => users);
vi.mock("next/headers", async () => {
  const { cookieJar } = await import("../helpers/cookie-jar");
  return { cookies: async () => cookieJar.store };
});

const { GET, DELETE } = await import("@/app/api/auth/user/route");

const NOW = new Date("2026-01-01T00:00:00Z");
const nowSeconds = NOW.getTime() / 1000;

function deleteRequest(origin = "https://example.com") {
  return new NextRequest("https://example.com/api/auth/user", {
    method: "DELETE",
    headers: { host: "example.com", origin },
  });
}

function givenSessionCookie() {
  cookieJar.store.set({ name: "sb-project-auth-token", value: "session" });
}

/** The access token's claims for `uid`, with the given `amr` */
function givenClaims(uid: string, amr: unknown) {
  supabaseDouble.auth.getClaims.mockResolvedValue({
    data: { claims: { sub: uid, amr } },
    error: null,
  });
}

function signedInAgo(ageSeconds: number) {
  return [{ method: "oauth", timestamp: nowSeconds - ageSeconds }];
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  cookieJar.reset();
  supabaseDouble.reset();
  stubSupabaseEnv();
  vi.setSystemTime(NOW);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/auth/user", () => {
  it("returns the user behind a valid session", async () => {
    supabaseDouble.givenUser("user-1", {
      metadata: {
        full_name: "Example User",
        avatar_url: "https://example.com/avatar.png",
      },
    });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      user: {
        uid: "user-1",
        email: "user@example.com",
        displayName: "Example User",
        photoURL: "https://example.com/avatar.png",
        role: "member",
      },
    });
  });

  it("answers 401 and clears a session Supabase rejects", async () => {
    givenSessionCookie();
    supabaseDouble.givenRejectedSession();

    const response = await GET();

    expect(response.status).toBe(401);
    expect(cookieJar.records.size).toBe(0);
  });

  it("answers 503 and keeps the cookie when Supabase cannot answer", async () => {
    givenSessionCookie();
    supabaseDouble.givenAuthOutage();

    const response = await GET();

    expect(response.status).toBe(503);
    expect(cookieJar.records.size).toBe(1);
  });
});

describe("DELETE /api/auth/user", () => {
  it("deletes the account after a recent Google sign-in and clears the session", async () => {
    givenSessionCookie();
    supabaseDouble.givenUser("user-1");
    givenClaims("user-1", signedInAgo(60));

    const response = await DELETE(deleteRequest());

    expect(response.status).toBe(200);
    expect(supabaseDouble.admin.auth.admin.deleteUser).toHaveBeenCalledWith("user-1");
    expect(cookieJar.records.size).toBe(0);
  });

  it("uses the latest Google sign-in of the session", async () => {
    supabaseDouble.givenUser("user-1");
    givenClaims("user-1", [
      { method: "oauth", timestamp: nowSeconds - 3600 },
      { method: "oauth", timestamp: nowSeconds - 30 },
    ]);

    const response = await DELETE(deleteRequest());

    expect(response.status).toBe(200);
  });

  it.each([
    ["an old sign-in", signedInAgo(10 * 60)],
    ["no Google sign-in", [{ method: "password", timestamp: nowSeconds }]],
    ["sign-ins without times", ["oauth"]],
    ["no amr claim", undefined],
  ])("asks for re-authentication after %s", async (_, amr) => {
    supabaseDouble.givenUser("user-1");
    givenClaims("user-1", amr);

    const response = await DELETE(deleteRequest());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      reauthRequired: true,
    });
    expect(supabaseDouble.admin.auth.admin.deleteUser).not.toHaveBeenCalled();
  });

  it("asks for re-authentication when the token belongs to someone else", async () => {
    supabaseDouble.givenUser("user-1");
    givenClaims("user-2", signedInAgo(10));

    const response = await DELETE(deleteRequest());

    expect(response.status).toBe(401);
    expect(supabaseDouble.admin.auth.admin.deleteUser).not.toHaveBeenCalled();
  });

  it("answers 401 without a session", async () => {
    const response = await DELETE(deleteRequest());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.not.toHaveProperty("reauthRequired");
    expect(supabaseDouble.admin.auth.admin.deleteUser).not.toHaveBeenCalled();
  });

  it("answers 500 and keeps the session when Supabase cannot answer", async () => {
    givenSessionCookie();
    supabaseDouble.givenAuthOutage();

    const response = await DELETE(deleteRequest());

    expect(response.status).toBe(500);
    expect(cookieJar.records.size).toBe(1);
  });

  it("keeps the session when the deletion itself fails", async () => {
    givenSessionCookie();
    supabaseDouble.givenUser("user-1");
    givenClaims("user-1", signedInAgo(60));
    supabaseDouble.admin.auth.admin.deleteUser.mockResolvedValue({
      data: null,
      error: new Error("database unavailable"),
    });

    const response = await DELETE(deleteRequest());

    expect(response.status).toBe(500);
    expect(cookieJar.records.size).toBe(1);
  });

  it("refuses to delete the only super admin, before asking for Google again", async () => {
    supabaseDouble.givenUser("boss", { role: "super_admin" });
    users.countSuperAdmins.mockResolvedValue(1);

    const response = await DELETE(deleteRequest());

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.not.toHaveProperty("reauthRequired");
    expect(supabaseDouble.auth.getClaims).not.toHaveBeenCalled();
    expect(supabaseDouble.admin.auth.admin.deleteUser).not.toHaveBeenCalled();
  });

  it("deletes a super admin when another one remains", async () => {
    supabaseDouble.givenUser("boss", { role: "super_admin" });
    users.countSuperAdmins.mockResolvedValue(2);
    givenClaims("boss", signedInAgo(60));

    const response = await DELETE(deleteRequest());

    expect(response.status).toBe(200);
    expect(supabaseDouble.admin.auth.admin.deleteUser).toHaveBeenCalledWith("boss");
  });

  it("does not count super admins for anyone else", async () => {
    supabaseDouble.givenUser("user-1", { role: "admin" });
    givenClaims("user-1", signedInAgo(60));

    await DELETE(deleteRequest());

    expect(users.countSuperAdmins).not.toHaveBeenCalled();
  });

  it("rejects a cross-site request", async () => {
    supabaseDouble.givenUser("user-1");
    givenClaims("user-1", signedInAgo(60));

    const response = await DELETE(deleteRequest("https://attacker.example"));

    expect(response.status).toBe(403);
    expect(supabaseDouble.admin.auth.admin.deleteUser).not.toHaveBeenCalled();
  });
});
