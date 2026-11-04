import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { stubSupabaseEnv, supabaseDouble } from "../helpers/supabase-double";

vi.mock("@/lib/supabase/server", async () => {
  const { supabaseDouble } = await import("../helpers/supabase-double");
  return { createClient: async () => supabaseDouble.client };
});

const { POST } = await import("@/app/api/auth/signin/route");
const { GET: CALLBACK } = await import("@/app/auth/callback/route");

const DEFAULT_HEADERS = {
  host: "example.com",
  origin: "https://example.com",
  "content-type": "application/json",
};

function signinRequest(
  body: unknown,
  headers: Record<string, string> = DEFAULT_HEADERS
) {
  return new NextRequest("https://example.com/api/auth/signin", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

function oauthOptions() {
  return supabaseDouble.auth.signInWithOAuth.mock.calls[0][0].options;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  supabaseDouble.reset();
  stubSupabaseEnv();
  vi.spyOn(console, "error").mockImplementation(() => {});
  supabaseDouble.auth.signInWithOAuth.mockResolvedValue({
    data: { provider: "google", url: "https://accounts.google.com/o/oauth2" },
    error: null,
  });
});

describe("POST /api/auth/signin", () => {
  it("returns the Google URL, coming back through the callback", async () => {
    const response = await POST(signinRequest({ next: "/shop" }));

    await expect(response.json()).resolves.toEqual({
      success: true,
      url: "https://accounts.google.com/o/oauth2",
    });
    expect(supabaseDouble.auth.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "google" })
    );
    expect(oauthOptions()).toMatchObject({
      redirectTo: "https://example.com/auth/callback?next=%2Fshop",
      skipBrowserRedirect: true,
    });
    expect(oauthOptions().queryParams).toBeUndefined();
  });

  it("asks Google to pick the account again for a re-authentication", async () => {
    await POST(signinRequest({ next: "/account", reauth: true }));

    expect(oauthOptions().queryParams).toEqual({ prompt: "select_account" });
  });

  it("refuses to come back to another site", async () => {
    await POST(signinRequest({ next: "https://attacker.example" }));

    expect(oauthOptions().redirectTo).toBe(
      "https://example.com/auth/callback?next=%2F"
    );
  });

  it("rejects a cross-site request (login CSRF)", async () => {
    const response = await POST(
      signinRequest({}, { ...DEFAULT_HEADERS, origin: "https://attacker.example" })
    );

    expect(response.status).toBe(403);
    expect(supabaseDouble.auth.signInWithOAuth).not.toHaveBeenCalled();
  });

  it("answers 503 in guest mode", async () => {
    vi.unstubAllEnvs();

    const response = await POST(signinRequest({}));

    expect(response.status).toBe(503);
    expect(supabaseDouble.auth.signInWithOAuth).not.toHaveBeenCalled();
  });

  it("answers 500 when Supabase cannot start the flow", async () => {
    supabaseDouble.auth.signInWithOAuth.mockResolvedValue({
      data: { provider: "google", url: null },
      error: new Error("provider disabled"),
    });

    const response = await POST(signinRequest({}));

    expect(response.status).toBe(500);
  });
});

describe("GET /auth/callback", () => {
  function callback(query: string) {
    return CALLBACK(new NextRequest(`https://example.com/auth/callback?${query}`));
  }

  it("exchanges the code and goes on to the requested page", async () => {
    supabaseDouble.auth.exchangeCodeForSession.mockResolvedValue({ error: null });

    const response = await callback("code=abc&next=%2Fplanner");

    expect(supabaseDouble.auth.exchangeCodeForSession).toHaveBeenCalledWith("abc");
    expect(response.headers.get("location")).toBe("https://example.com/planner");
  });

  it.each(["https://attacker.example", "//attacker.example", "/\\attacker.example"])(
    "never redirects off the site (next=%s)",
    async (next) => {
      supabaseDouble.auth.exchangeCodeForSession.mockResolvedValue({ error: null });

      const response = await callback(`code=abc&next=${encodeURIComponent(next)}`);

      expect(response.headers.get("location")).toBe("https://example.com/");
    }
  );

  it("sends a failed exchange to the Account page", async () => {
    supabaseDouble.auth.exchangeCodeForSession.mockResolvedValue({
      error: new Error("code verifier missing"),
    });

    const response = await callback("code=abc&next=%2Fshop");

    expect(response.headers.get("location")).toBe(
      "https://example.com/account?signInFailed=1"
    );
  });

  it("sends a cancelled sign-in to the Account page", async () => {
    const response = await callback("error=access_denied");

    expect(supabaseDouble.auth.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://example.com/account?signInFailed=1"
    );
  });
});
