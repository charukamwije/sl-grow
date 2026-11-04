import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookies } from "@/lib/supabase/auth-server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isRejectedSessionError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import { rejectCrossSiteRequest } from "@/lib/utils/request-origin";

// Sign out API handler
export async function POST(request: NextRequest) {
  const rejected = rejectCrossSiteRequest(request);
  if (rejected) {
    return rejected;
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true });
  }

  const supabase = await createClient();

  // The global scope revokes every refresh token of this user, so a copied
  // cookie stops working on every device too. Only deleting the cookie here
  // would leave such a copy usable.
  const { error } = await supabase.auth.signOut({ scope: "global" });

  // The cookies are gone from this browser either way
  await clearSessionCookies();

  // A session Supabase already rejects has nothing left to revoke. An outage
  // is a real failure: the session lives on elsewhere until it is revoked, so
  // the caller has to hear about it.
  if (error && !isRejectedSessionError(error)) {
    console.error("Sign out revocation error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          "Signed out on this device, but the server session could not be revoked.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
