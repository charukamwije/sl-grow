import type { CookieOptions, CookieOptionsWithName } from "@supabase/ssr";

// Supabase names its session cookies `sb-<project ref>-auth-token`, split
// into `.0`, `.1`, ... chunks when large, plus a PKCE code verifier cookie
// during sign-in. All of them share this prefix.
export const SESSION_COOKIE_PREFIX = "sb-";

// Session expiration time (2 weeks). Every token refresh re-sets the cookies,
// so this is two weeks without a visit rather than two weeks after sign-in.
export const SESSION_EXPIRES_IN = 60 * 60 * 24 * 14 * 1000;

/**
 * Only the server talks to Supabase Auth, so the session cookies never have
 * to be readable from page scripts.
 */
export const SESSION_COOKIE_OPTIONS: CookieOptionsWithName = {
  path: "/",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
};

/**
 * The options to write one session cookie with. `@supabase/ssr` sets every
 * cookie it stores for 400 days whatever `cookieOptions` says, so the
 * session's own lifetime is put back here; removals (`maxAge: 0`) pass
 * through untouched.
 */
export function withSessionLifetime(options: CookieOptions): CookieOptions {
  return options.maxAge === 0
    ? options
    : { ...options, maxAge: SESSION_EXPIRES_IN / 1000 };
}

// How long a sign-in counts as fresh proof of identity for account deletion
const MAX_TOKEN_AGE_SECONDS = 5 * 60;

/**
 * True when a timestamp (seconds since the epoch) is recent enough to act as
 * proof that the user just signed in.
 */
export function isRecent(timestampSeconds: number): boolean {
  return Date.now() / 1000 - timestampSeconds <= MAX_TOKEN_AGE_SECONDS;
}

/**
 * Where to send the browser after sign-in. Only a path on this site is
 * accepted - anything else, including protocol-relative `//host` and the
 * `/\host` form browsers treat the same way, would make the callback an open
 * redirect.
 */
export function safeNextPath(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\")
  ) {
    return "/";
  }

  return value;
}
