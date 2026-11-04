// Fails the build if this module is ever pulled into a client bundle
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SESSION_COOKIE_OPTIONS, withSessionLifetime } from "./session";

/**
 * A Supabase client acting as the signed-in user, reading and refreshing the
 * session through this request's cookies. It holds only the publishable key:
 * the tables deny that role everything, so this client is for auth only and
 * data goes through `adminDb`.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions: SESSION_COOKIE_OPTIONS,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, withSessionLifetime(options));
            }
          } catch {
            // Server Components cannot set cookies. `proxy.ts` refreshes the
            // session before the page renders, so nothing is lost here.
          }
        },
      },
    }
  );
}
