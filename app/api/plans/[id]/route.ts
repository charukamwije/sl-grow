import { NextRequest, NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog-server";
import { resolveUid } from "@/lib/supabase/route-auth";
import { deletePlan, updatePlan } from "@/lib/supabase/store";
import { hasSelection, planRecord, readInputs } from "@/lib/planner/inputs";
import { rejectCrossSiteRequest } from "@/lib/utils/request-origin";

type Context = { params: Promise<{ id: string }> };

// Someone else's plan answers the same as one that does not exist (FR-A-11)
const notFound = () =>
  NextResponse.json({ success: false, error: "Plan not found." }, { status: 404 });

/** Replaces one of the customer's own saved plans with new inputs */
export async function PUT(request: NextRequest, { params }: Context) {
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
    const { id } = await params;
    if (!(await updatePlan(uid, id, planRecord(inputs, await getCatalog())))) {
      return notFound();
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Plan update error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to update the plan." },
      { status: 500 }
    );
  }
}

/** Deletes one of the customer's own saved plans */
export async function DELETE(request: NextRequest, { params }: Context) {
  const rejected = rejectCrossSiteRequest(request, true);
  if (rejected) {
    return rejected;
  }

  const uid = await resolveUid();
  if (typeof uid !== "string") {
    return uid;
  }

  try {
    if (!(await deletePlan(uid, (await params).id))) {
      return notFound();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Plan delete error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to delete the plan." },
      { status: 500 }
    );
  }
}
