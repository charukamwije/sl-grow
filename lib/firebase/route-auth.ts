// Fails the build if this module is ever pulled into a client bundle
import "server-only";
import { NextResponse } from "next/server";
import { getServerSession } from "./auth-server";

/**
 * The signed-in uid for an API route, or the response to send instead. Every
 * per-user Firestore path takes its uid from here, never from the request,
 * which is what keeps a customer's cart, orders and plans private (FR-A-11).
 */
export async function resolveUid(): Promise<string | NextResponse> {
  const session = await getServerSession();

  if (session.state === "unavailable") {
    // Firebase could not answer, so "not signed in" would be a lie.
    return NextResponse.json(
      { success: false, error: "Authentication is unavailable." },
      { status: 503 }
    );
  }

  if (session.state === "invalid") {
    return NextResponse.json(
      { success: false, error: "No authenticated user found." },
      { status: 401 }
    );
  }

  return session.user.uid;
}
