import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { VEGETABLES } from "@/lib/data/vegetables";
import { resolveUid } from "@/lib/firebase/route-auth";
import { userPlans } from "@/lib/firebase/store";
import {
  computePlan,
  toAmount,
  type PlannerInputs,
  type VegInput,
} from "@/lib/planner/calc";
import { rejectCrossSiteRequest } from "@/lib/utils/request-origin";

const MAX_PEOPLE = 100;
const MAX_SPACE = 100_000;
const MAX_VALUE = 1_000_000;

// Only known vegetables, with numbers clamped to sane ranges
function readInputs(value: unknown): PlannerInputs | null {
  const raw = value as { people?: unknown; space?: unknown; veg?: unknown } | null;
  if (!raw || typeof raw.veg !== "object" || raw.veg === null) return null;

  const veg: Record<string, VegInput> = {};
  for (const { id } of VEGETABLES) {
    const input = (raw.veg as Record<string, Partial<VegInput> | undefined>)[id];
    if (!input) continue;
    veg[id] = {
      selected: input.selected === true,
      price: Math.min(toAmount(input.price), MAX_VALUE),
      gramsPerWeek: Math.min(toAmount(input.gramsPerWeek), MAX_VALUE),
    };
  }

  return {
    people: Math.min(Math.floor(toAmount(raw.people)), MAX_PEOPLE),
    space: Math.min(toAmount(raw.space), MAX_SPACE),
    veg,
  };
}

/**
 * Save the signed-in customer's planner result (FR-A-08). The plan is
 * recomputed here from the inputs, so the stored totals always match the
 * calculation rather than whatever a client sent. Create only (FR-A-12).
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

  if (!inputs || !Object.values(inputs.veg).some((input) => input.selected)) {
    return NextResponse.json(
      { success: false, error: "The plan is incomplete." },
      { status: 400 }
    );
  }

  const plan = computePlan(inputs);

  try {
    const ref = await userPlans(uid).add({
      people: inputs.people,
      space: inputs.space,
      vegetables: inputs.veg,
      plants: Object.fromEntries(
        plan.rows.map((row) => [row.veg.id, row.plants])
      ),
      shopping: plan.shopping,
      total: plan.shoppingTotal,
      yearlySavings: plan.savings.yearly,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, id: ref.id });
  } catch (error) {
    console.error("Plan save error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to save the plan." },
      { status: 500 }
    );
  }
}
