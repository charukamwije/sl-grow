import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { resolveUid } from "@/lib/firebase/route-auth";
import { userCart } from "@/lib/firebase/store";
import { mergeCarts, sanitizeCart } from "@/lib/products";
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
  const deviceCart = sanitizeCart((body as { cart?: unknown } | null)?.cart);

  try {
    // In a transaction so two devices merging at once cannot drop each
    // other's items
    const merged = await adminDb.runTransaction(async (transaction) => {
      const ref = userCart(uid);
      const snapshot = await transaction.get(ref);
      const result = mergeCarts(sanitizeCart(snapshot.get("items")), deviceCart);

      transaction.set(ref, {
        items: result,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return result;
    });

    return NextResponse.json({ success: true, cart: merged });
  } catch (error) {
    console.error("Cart merge error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to merge the cart." },
      { status: 500 }
    );
  }
}
