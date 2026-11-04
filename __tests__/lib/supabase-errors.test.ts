import {
  AuthApiError,
  AuthRetryableFetchError,
  AuthSessionMissingError,
} from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { isRejectedSessionError } from "@/lib/supabase/errors";

describe("isRejectedSessionError", () => {
  it("treats a missing session as rejected", () => {
    expect(isRejectedSessionError(new AuthSessionMissingError())).toBe(true);
  });

  it.each([
    [400, "refresh_token_not_found"],
    [401, "bad_jwt"],
    [403, "session_not_found"],
    [404, "user_not_found"],
  ])("treats an Auth server %i (%s) as rejected", (status, code) => {
    expect(isRejectedSessionError(new AuthApiError("no", status, code))).toBe(true);
  });

  it.each([
    // The request never reached a verdict - treating these as a rejection
    // would clear a session that may still be good.
    ["a network failure", new AuthRetryableFetchError("fetch failed", 0)],
    ["a 5xx", new AuthApiError("boom", 500, "unexpected_failure")],
    ["rate limiting", new AuthApiError("slow down", 429, "over_request_rate_limit")],
    ["an unrelated error", new Error("Session not found")],
    ["nothing at all", null],
  ])("does not treat %s as rejected", (_, error) => {
    expect(isRejectedSessionError(error)).toBe(false);
  });
});
