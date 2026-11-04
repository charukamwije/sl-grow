import { isAuthApiError, isAuthSessionMissingError } from "@supabase/supabase-js";

/**
 * True when Supabase Auth actually rejected the session the caller presented:
 * there is none, or the Auth server answered with a 4xx (expired, revoked,
 * user gone). Only a real rejection may clear a session or count as "already
 * signed out".
 *
 * A network failure, a 5xx or rate limiting (429) says the request never
 * reached a verdict, and reporting that as "signed out" would be a lie.
 */
export function isRejectedSessionError(error: unknown): boolean {
  if (isAuthSessionMissingError(error)) {
    return true;
  }

  return (
    isAuthApiError(error) &&
    error.status >= 400 &&
    error.status < 500 &&
    error.status !== 429
  );
}
