import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { resolveUid } from "@/lib/firebase/route-auth";
import { userCart } from "@/lib/firebase/store";
import { sanitizeCart } from "@/lib/products";
import { rejectCrossSiteRequest } from "@/lib/utils/request-origin";

// Read the signed-in customer's cloud cart
export async function GET() {
  const uid = await resolveUid();
  if (typeof uid !== "string") {
    return uid;
  }

  try {
    const snapshot = await userCart(uid).get();

    return NextResponse.json({
      success: true,
      cart: sanitizeCart(snapshot.get("items")),
    });
  } catch (error) {
    console.error("Cart read error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to load the cart." },
      { status: 500 }
    );
  }
}

// Replace the cloud cart after a change on this device (FR-A-04)
export async function PUT(request: NextRequest) {
  const rejected = rejectCrossSiteRequest(request, true);
  if (rejected) {
    return rejected;
  }

  const uid = await resolveUid();
  if (typeof uid !== "string") {
    return uid;
  }

  const body = await request.json().catch(() => null);
  const raw = (body as { cart?: unknown } | null)?.cart;

  // A malformed body must not silently empty the stored cart
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return NextResponse.json(
      { success: false, error: "A cart is required." },
      { status: 400 }
    );
  }

  const cart = sanitizeCart(raw);

  try {
    await userCart(uid).set({
      items: cart,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, cart });
  } catch (error) {
    console.error("Cart save error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to save the cart." },
      { status: 500 }
    );
  }
}
