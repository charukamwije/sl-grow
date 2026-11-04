import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/supabase/session";

/**
 * Where Google sends the browser back to. Trading the code for a session sets
 * the session cookies; the code is only good together with the PKCE verifier
 * cookie that `/api/auth/signin` left in this same browser.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));

  if (code && isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }

    console.error("Sign in callback error:", error);
  }

  // Cancelled at Google, or the code could not be used
  return NextResponse.redirect(new URL("/account?signInFailed=1", request.url));
}
