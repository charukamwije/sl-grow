import { NextRequest } from "next/server";
import { AuthApiError, AuthRetryableFetchError } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cookieJar } from "../helpers/cookie-jar";
import { stubSupabaseEnv, supabaseDouble } from "../helpers/supabase-double";

vi.mock("@/lib/supabase/server", async () => {
  const { supabaseDouble } = await import("../helpers/supabase-double");
  return { createClient: async () => supabaseDouble.client };
});
vi.mock("next/headers", async () => {
  const { cookieJar } = await import("../helpers/cookie-jar");
  return { cookies: async () => cookieJar.store };
});

const { POST } = await import("@/app/api/auth/signout/route");

function signoutRequest(origin = "https://example.com") {
  return new NextRequest("https://example.com/api/auth/signout", {
    method: "POST",
    headers: { host: "example.com", origin },
  });
}

function givenSessionCookies() {
  cookieJar.store.set({ name: "sb-project-auth-token.0", value: "chunk-0" });
  cookieJar.store.set({ name: "sb-project-auth-token.1", value: "chunk-1" });
  cookieJar.store.set({ name: "language", value: "si" });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  cookieJar.reset();
  supabaseDouble.reset();
  stubSupabaseEnv();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/auth/signout", () => {
  it("revokes every session of the user and clears only the Supabase cookies", async () => {
    givenSessionCookies();

    const response = await POST(signoutRequest());

    expect(response.status).toBe(200);
    expect(supabaseDouble.auth.signOut).toHaveBeenCalledWith({ scope: "global" });
    expect([...cookieJar.records.keys()]).toEqual(["language"]);
  });

  it("counts a session Supabase already rejects as signed out", async () => {
    givenSessionCookies();
    supabaseDouble.auth.signOut.mockResolvedValue({
      error: new AuthApiError("Session not found", 403, "session_not_found"),
    });

    const response = await POST(signoutRequest());

    expect(response.status).toBe(200);
    expect(cookieJar.records.has("sb-project-auth-token.0")).toBe(false);
  });

  it("reports an outage, though this browser is signed out either way", async () => {
    givenSessionCookies();
    supabaseDouble.auth.signOut.mockResolvedValue({
      error: new AuthRetryableFetchError("fetch failed", 0),
    });

    const response = await POST(signoutRequest());

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({ success: false });
    expect(cookieJar.records.has("sb-project-auth-token.0")).toBe(false);
  });

  it("rejects a cross-site request", async () => {
    givenSessionCookies();

    const response = await POST(signoutRequest("https://attacker.example"));

    expect(response.status).toBe(403);
    expect(supabaseDouble.auth.signOut).not.toHaveBeenCalled();
    expect(cookieJar.records.has("sb-project-auth-token.0")).toBe(true);
  });

  it("has nothing to do in guest mode", async () => {
    vi.unstubAllEnvs();

    const response = await POST(signoutRequest());

    expect(response.status).toBe(200);
    expect(supabaseDouble.auth.signOut).not.toHaveBeenCalled();
  });
});
