// Fails the build if this module is ever pulled into a client bundle
import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Without credentials the app runs in guest mode (FR-A-10). Nobody can sign
 * in then, so no session exists and `getServerSession` answers before
 * touching this. Anything that does reach it gets this error instead of the
 * whole app failing at import.
 */
function notConfigured<T extends object>(name: string): T {
  return new Proxy({} as T, {
    get() {
      throw new Error(
        `${name} is unavailable: SUPABASE_URL and SUPABASE_SECRET_KEY are not set. Copy .env.local.example to .env.local and fill in your Supabase project's values.`
      );
    },
  });
}

const url = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

/**
 * The service-role client. It bypasses row level security, which is why it
 * is the only way to the tables - and why every query it runs has to be
 * scoped to a uid from the verified session (FR-A-11).
 */
export const adminDb: SupabaseClient =
  url && secretKey
    ? createClient(url, secretKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : notConfigured<SupabaseClient>("Supabase");
