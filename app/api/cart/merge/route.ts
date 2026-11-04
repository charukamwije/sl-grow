import { NextRequest, NextResponse } from "next/server";
import { resolveUid } from "@/lib/supabase/route-auth";
import { mergeCart } from "@/lib/supabase/store";
import { getCatalog } from "@/lib/catalog-server";
import { rejectCrossSiteRequest } from "@/lib/utils/request-origin";

/**
 * Merge this device's cart into the cloud cart on sign-in or page load
 * (BR-20: the larger quantity of each product wins) and return the result,
 * which becomes the cart on both sides.
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

  const body = await request.json().catch(() => null);

  try {
    const { sanitizeCart } = await getCatalog();
    const deviceCart = sanitizeCart((body as { cart?: unknown } | null)?.cart);

    // In one database statement so two devices merging at once cannot drop
    // each other's items
    const merged = sanitizeCart(await mergeCart(uid, deviceCart));

    return NextResponse.json({ success: true, cart: merged });
  } catch (error) {
    console.error("Cart merge error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to merge the cart." },
      { status: 500 }
    );
  }
}
