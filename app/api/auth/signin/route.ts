import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/supabase/session";
import { rejectCrossSiteRequest } from "@/lib/utils/request-origin";

/**
 * Starts Google sign-in. The answer is the Google URL the browser goes to
 * next; on the way the Supabase client stores the PKCE code verifier in an
 * httpOnly cookie, and `/auth/callback` needs that cookie to finish. A code
 * returned to any other browser - a login CSRF attempt - cannot be exchanged.
 */
export async function POST(request: NextRequest) {
  const rejected = rejectCrossSiteRequest(request, true);
  if (rejected) {
    return rejected;
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, error: "Accounts are not set up on this site." },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => null)) as {
    next?: unknown;
    reauth?: unknown;
  } | null;
  const next = safeNextPath(body?.next);

  // The origin check above already proved this header is this site
  const callback = new URL("/auth/callback", request.headers.get("origin")!);
  callback.searchParams.set("next", next);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callback.toString(),
      skipBrowserRedirect: true,
      // Re-authentication before account deletion must not be satisfied by
      // Google silently reusing whichever account the browser has open
      ...(body?.reauth === true
        ? { queryParams: { prompt: "select_account" } }
        : {}),
    },
  });

  if (error || !data.url) {
    console.error("Sign in error:", error);

    return NextResponse.json(
      { success: false, error: "Sign-in could not be started." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, url: data.url });
}
