import { NextRequest, NextResponse } from "next/server";
import { parseApplication } from "@/lib/certification/status";
import {
  AlreadyCertifiedError,
  createApplication,
  OpenApplicationError,
} from "@/lib/certifications-server";
import { resolveUid } from "@/lib/supabase/route-auth";
import { rejectCrossSiteRequest } from "@/lib/utils/request-origin";

/**
 * A signed-in user applies for Aswedduma Certified (FR-J-04). The server
 * makes the reference; admins then move the application through its status.
 */
export async function POST(request: NextRequest) {
  const rejected = rejectCrossSiteRequest(request, true);
  if (rejected) return rejected;

  const uid = await resolveUid();
  if (typeof uid !== "string") return uid;

  const body = await request.json().catch(() => null);
  const input = parseApplication(body);

  if (!input) {
    return NextResponse.json(
      { success: false, error: "The application is incomplete." },
      { status: 400 }
    );
  }

  try {
    const { id, ref } = await createApplication(uid, input);
    return NextResponse.json({ success: true, id, ref });
  } catch (error) {
    if (error instanceof OpenApplicationError) {
      return NextResponse.json(
        { success: false, error: "open", message: "You already have an open application for this path." },
        { status: 409 }
      );
    }
    if (error instanceof AlreadyCertifiedError) {
      return NextResponse.json(
        { success: false, error: "certified", message: "You already hold a valid certificate for this path." },
        { status: 409 }
      );
    }

    console.error("Certification application error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send the application." },
      { status: 500 }
    );
  }
}
