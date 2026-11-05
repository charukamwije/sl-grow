import { NextRequest, NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog-server";
import { resolveUid } from "@/lib/supabase/route-auth";
import { insertPlan } from "@/lib/supabase/store";
import { hasSelection, planRecord, readInputs } from "@/lib/planner/inputs";
import { rejectCrossSiteRequest } from "@/lib/utils/request-origin";

/**
 * Save the signed-in customer's planner result (FR-A-08). The plan is
 * recomputed here from the inputs, so the stored totals always match the
 * calculation rather than whatever a client sent. Saved plans are updated or
 * deleted through /api/plans/[id].
 */
export async function POST(request: NextRequest) {
  const rejected = rejectCrossSiteRequest(request, true);
  if (rejected) {
    return rejected;
  }

  const uid = await resolveUid();
  if (typeof uid !== "string") {
    return uid;
  }

  const body = (await request.json().catch(() => null)) as {
    inputs?: unknown;
  } | null;
  const inputs = readInputs(body?.inputs);

  if (!inputs || !hasSelection(inputs)) {
    return NextResponse.json(
      { success: false, error: "The plan is incomplete." },
      { status: 400 }
    );
  }

  try {
    const id = await insertPlan(uid, planRecord(inputs, await getCatalog()));

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Plan save error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to save the plan." },
      { status: 500 }
    );
  }
}
