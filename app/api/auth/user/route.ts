import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { getServerSession } from "@/lib/firebase/auth-server";
import { userDoc } from "@/lib/firebase/store";
import { SESSION_COOKIE_NAME, isRecent } from "@/lib/firebase/session";
import { isRejectedCredentialError } from "@/lib/utils/firebaseErrors";
import { rejectCrossSiteRequest } from "@/lib/utils/request-origin";

// Get current authenticated user information
export async function GET() {
  const session = await getServerSession();

  if (session.state === "unavailable") {
    // Firebase could not answer, so "not signed in" would be a lie.
    return NextResponse.json(
      { success: false, user: null, error: "Authentication is unavailable." },
      { status: 503 }
    );
  }

  if (session.state === "invalid") {
    // The cookie cannot authenticate anyone; stop sending it back.
    (await cookies()).delete(SESSION_COOKIE_NAME);

    return NextResponse.json({ success: false, user: null }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    user: session.user,
  });
}

// Delete user account API handler
export async function DELETE(request: NextRequest) {
  const rejected = rejectCrossSiteRequest(request, true);
  if (rejected) {
    return rejected;
  }

  const cookieStore = await cookies();

  // Get session information from cookie
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return NextResponse.json(
      { success: false, error: "No authenticated user found." },
      { status: 401 }
    );
  }

  // Admin deletion bypasses Firebase's client-side `requires-recent-login`
  // rule, so the caller must also prove it still holds the account credential:
  // a session cookie alone may be two weeks old and merely copied.
  const body = await request.json().catch(() => null);
  const idToken =
    typeof (body as { idToken?: unknown })?.idToken === "string"
      ? (body as { idToken: string }).idToken
      : null;

  if (!idToken) {
    return NextResponse.json(
      { success: false, error: "Re-authentication is required." },
      { status: 401 }
    );
  }

  let uid: string;

  try {
    // Verify session cookie
    const decodedClaims = await adminAuth.verifySessionCookie(
      sessionCookie,
      true
    );

    // Get the user UID from decoded claims
    uid = decodedClaims.uid;

    const decodedToken = await adminAuth.verifyIdToken(idToken, true);

    if (decodedToken.uid !== uid) {
      return NextResponse.json(
        { success: false, error: "Re-authentication is required." },
        { status: 403 }
      );
    }

    // The client re-authenticates with Google first, so the token must come
    // from a sign-in that just happened - otherwise an hour-old copied token
    // would be accepted.
    if (!isRecent(decodedToken.auth_time)) {
      return NextResponse.json(
        { success: false, error: "Re-authentication is required." },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Account deletion authentication error:", error);

    // An expired or revoked credential is the caller's problem, not a server
    // fault, and the Admin SDK's message must not reach the client. A backend
    // failure keeps the session: the credential may well still be good.
    if (isRejectedCredentialError(error)) {
      // Delete session cookie
      cookieStore.delete(SESSION_COOKIE_NAME);

      return NextResponse.json(
        { success: false, error: "Re-authentication is required." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to delete account." },
      { status: 500 }
    );
  }

  try {
    // Delete the user from Firebase Auth
    await adminAuth.deleteUser(uid);
  } catch (error) {
    // The account is still there, so the session cookie stays valid too.
    console.error("Account deletion error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to delete account." },
      { status: 500 }
    );
  }

  let dataDeleted = true;

  // The Auth user goes first: a failed `deleteUser` leaves everything intact
  // and retryable, and destroying the data of an account that still exists is
  // worse than leaving data behind for one that does not. The sweep follows
  // because that uid can no longer pass `verifySessionCookie(cookie, true)`,
  // so no new authenticated write can reach the collection.
  //
  // Data can still be left behind, and nothing here promises otherwise: a
  // request that was already past session verification when `deleteUser`
  // returned can still commit its write, and `recursiveDelete` can delete part
  // of the tree before rejecting. Either path leaves data under a uid
  // nobody can authenticate as again - unreachable through this API and only
  // removable out of band. A production app closes both with a Cloud Functions
  // `onDelete` trigger on the auth user or a scheduled reaper.
  try {
    // Firestore does not cascade, so the cart, orders and plans under the
    // user document have to be swept explicitly or they outlive the account.
    // Orders go too; the shop already has each one in WhatsApp (OI-16).
    await adminDb.recursiveDelete(userDoc(uid));
  } catch (error) {
    console.error("Account data deletion error:", error);
    dataDeleted = false;
  }

  // Delete session cookie. The failures above keep it because the credential
  // may well still be good; here the account is gone, so there is none left to
  // preserve - not even on the partial-failure 500 below.
  cookieStore.delete(SESSION_COOKIE_NAME);

  if (!dataDeleted) {
    // The account is gone either way, so the caller must not be told to retry
    // a deletion that already happened.
    return NextResponse.json(
      {
        success: false,
        accountDeleted: true,
        error: "Account deleted, but some of its data could not be removed.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
