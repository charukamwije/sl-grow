import { NextRequest, NextResponse } from "next/server";
import type { AMREntry } from "@supabase/supabase-js";
import { adminDb } from "@/lib/supabase/admin";
import {
  clearSessionCookies,
  getServerSession,
} from "@/lib/supabase/auth-server";
import { createClient } from "@/lib/supabase/server";
import { isRecent } from "@/lib/supabase/session";
import { countSuperAdmins } from "@/lib/supabase/users";
import { rejectCrossSiteRequest } from "@/lib/utils/request-origin";

const REAUTH_REQUIRED = "Re-authentication is required.";

// Get current authenticated user information
export async function GET() {
  const session = await getServerSession();

  if (session.state === "unavailable") {
    // Supabase could not answer, so "not signed in" would be a lie.
    return NextResponse.json(
      { success: false, user: null, error: "Authentication is unavailable." },
      { status: 503 }
    );
  }

  if (session.state === "invalid") {
    // The cookie cannot authenticate anyone; stop sending it back.
    await clearSessionCookies();

    return NextResponse.json({ success: false, user: null }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    user: session.user,
  });
}

/**
 * When the user last signed in with Google, from the access token's `amr`
 * claim. A custom access token hook may shorten entries to bare strings,
 * which carry no time and so never count as recent.
 */
function lastOAuthSignIn(amr: unknown): number | null {
  if (!Array.isArray(amr)) return null;

  const times = (amr as (AMREntry | string)[])
    .filter(
      (entry): entry is AMREntry =>
        typeof entry === "object" &&
        entry !== null &&
        entry.method === "oauth" &&
        typeof entry.timestamp === "number"
    )
    .map((entry) => entry.timestamp);

  return times.length > 0 ? Math.max(...times) : null;
}

// Delete user account API handler
export async function DELETE(request: NextRequest) {
  const rejected = rejectCrossSiteRequest(request);
  if (rejected) {
    return rejected;
  }

  const session = await getServerSession();

  if (session.state === "unavailable") {
    return NextResponse.json(
      { success: false, error: "Failed to delete account." },
      { status: 500 }
    );
  }

  if (session.state === "invalid") {
    await clearSessionCookies();

    return NextResponse.json(
      { success: false, error: "No authenticated user found." },
      { status: 401 }
    );
  }

  const { uid } = session.user;

  // A database trigger refuses this too (0002_roles.sql), even for two
  // deletions racing; checking here first turns it into a clear answer.
  if (session.user.role === "super_admin") {
    let superAdmins: number;
    try {
      superAdmins = await countSuperAdmins();
    } catch (countError) {
      console.error("Account deletion role check error:", countError);
      return NextResponse.json(
        { success: false, error: "Failed to delete account." },
        { status: 500 }
      );
    }

    if (superAdmins <= 1) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You are the only super admin. Make someone else a super admin before deleting your account.",
        },
        { status: 409 }
      );
    }
  }

  // A session cookie alone may be two weeks old and merely copied, so
  // deleting needs a Google sign-in from the last few minutes. Without one the
  // client sends the user through Google again and retries.
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data) {
    console.error("Account deletion authentication error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to delete account." },
      { status: 500 }
    );
  }

  const signedInAt = lastOAuthSignIn(data.claims.amr);

  if (data.claims.sub !== uid || signedInAt === null || !isRecent(signedInAt)) {
    return NextResponse.json(
      { success: false, reauthRequired: true, error: REAUTH_REQUIRED },
      { status: 401 }
    );
  }

  // The cart, orders and plans reference the user with ON DELETE CASCADE, so
  // they go in the same statement - there is no half-deleted account to
  // report. Orders go too; the shop already has each one in WhatsApp (OI-16).
  const { error: deleteError } = await adminDb.auth.admin.deleteUser(uid);

  if (deleteError) {
    // The account is still there, so the session stays valid too.
    console.error("Account deletion error:", deleteError);

    return NextResponse.json(
      { success: false, error: "Failed to delete account." },
      { status: 500 }
    );
  }

  await clearSessionCookies();

  return NextResponse.json({ success: true });
}
