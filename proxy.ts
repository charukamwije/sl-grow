import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  SESSION_COOKIE_OPTIONS,
  SESSION_COOKIE_PREFIX,
  withSessionLifetime,
} from "@/lib/supabase/session";

/**
 * Refreshes an expired Supabase access token before the page renders. Server
 * Components cannot write cookies, so without this a refreshed session would
 * never be stored and every render after the first hour would refresh again.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Guests and guest mode have no session to refresh, so skip the round trip
  const hasSession = request.cookies
    .getAll()
    .some(({ name }) => name.startsWith(SESSION_COOKIE_PREFIX));

  if (!hasSession || !isSupabaseConfigured()) {
    return response;
  }

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions: SESSION_COOKIE_OPTIONS,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Onto the request, so this render sees the new tokens, and onto
          // the response, so the browser keeps them
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, withSessionLifetime(options));
          }
        },
      },
    }
  );

  // Refreshes the session when the access token has expired. Authorisation
  // still happens in `getServerSession`, which asks the Auth server.
  await supabase.auth.getClaims();

  return response;
}

export const config = {
  // Pages and API routes only, not static files or images
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
