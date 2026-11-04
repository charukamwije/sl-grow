import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteSession,
  deleteUserAccount,
  startSignIn,
} from "@/lib/supabase/authService";

const fetchMock = vi.fn();

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body };
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("startSignIn", () => {
  it("posts where to come back to and returns the Google URL", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ success: true, url: "https://accounts.google.com/o" })
    );

    await expect(startSignIn("/shop")).resolves.toEqual({
      success: true,
      url: "https://accounts.google.com/o",
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ next: "/shop", reauth: false }),
    });
  });

  it("flags a re-authentication", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true, url: "https://g" }));

    await startSignIn("/account", true);

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      next: "/account",
      reauth: true,
    });
  });

  it("surfaces the server's error message on a rejected response", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ success: false, error: "Accounts are not set up on this site." }, false)
    );

    await expect(startSignIn("/")).resolves.toEqual({
      success: false,
      error: "Accounts are not set up on this site.",
    });
  });

  it("fails without a URL even on a 200", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true }));

    await expect(startSignIn("/")).resolves.toEqual({
      success: false,
      error: "Sign-in could not be started.",
    });
  });

  it("keeps a thrown error's own message when it has one", async () => {
    fetchMock.mockRejectedValue(new Error("Failed to fetch"));

    await expect(startSignIn("/")).resolves.toEqual({
      success: false,
      error: "Failed to fetch",
    });
  });
});

describe("deleteSession", () => {
  it("posts to the sign-out route with no body", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true }));

    await expect(deleteSession()).resolves.toEqual({ success: true });
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/signout", {
      method: "POST",
    });
  });

  it("reports a revocation failure back to the caller", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          success: false,
          error:
            "Signed out on this device, but the server session could not be revoked.",
        },
        false
      )
    );

    await expect(deleteSession()).resolves.toEqual({
      success: false,
      error:
        "Signed out on this device, but the server session could not be revoked.",
    });
  });

  it("falls back to a generic message when the request throws", async () => {
    fetchMock.mockRejectedValue(new Error(""));

    await expect(deleteSession()).resolves.toEqual({
      success: false,
      error: "An error occurred while signing out.",
    });
  });
});

describe("deleteUserAccount", () => {
  it("sends DELETE to the user route", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true }));

    await expect(deleteUserAccount()).resolves.toEqual({ success: true });
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/user", {
      method: "DELETE",
    });
  });

  it("surfaces a re-authentication demand", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          success: false,
          reauthRequired: true,
          error: "Re-authentication is required.",
        },
        false
      )
    );

    await expect(deleteUserAccount()).resolves.toEqual({
      success: false,
      reauthRequired: true,
      error: "Re-authentication is required.",
    });
  });

  it("reports a refusal without flags", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ success: false, error: "Failed to delete account." }, false)
    );

    await expect(deleteUserAccount()).resolves.toEqual({
      success: false,
      error: "Failed to delete account.",
    });
  });

  it("marks the outcome unknown when no answer arrives", async () => {
    // The deletion may well have gone through, so this must not read as a
    // refusal.
    fetchMock.mockRejectedValue(new Error(""));

    await expect(deleteUserAccount()).resolves.toEqual({
      success: false,
      outcomeUnknown: true,
      error: "An error occurred while deleting account.",
    });
  });
});
