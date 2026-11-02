import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { resolveUid } from "@/lib/firebase/route-auth";
import { userOrders } from "@/lib/firebase/store";
import { generateOrderRef, isOrderRef } from "@/lib/order/reference";
import {
  validateCheckout,
  type CheckoutDetails,
} from "@/lib/order/whatsapp";
import {
  cartTotal,
  getProduct,
  lineTotal,
  productCode,
  sanitizeCart,
} from "@/lib/products";
import { rejectCrossSiteRequest } from "@/lib/utils/request-origin";

const MAX_FIELD = 200;
const MAX_LONG_FIELD = 1000;

function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length <= max ? trimmed : null;
}

function readDetails(value: unknown): CheckoutDetails | null {
  const raw = (value ?? {}) as Record<string, unknown>;
  const name = text(raw.name, MAX_FIELD);
  const phone = text(raw.phone, MAX_FIELD);
  const address = text(raw.address ?? "", MAX_LONG_FIELD);
  const notes = text(raw.notes ?? "", MAX_LONG_FIELD);
  const method = raw.method;

  if (
    name === null ||
    phone === null ||
    address === null ||
    notes === null ||
    (method !== "pickup" && method !== "delivery")
  ) {
    return null;
  }

  return { name, phone, method, address: method === "delivery" ? address : "", notes };
}

/**
 * Save a signed-in customer's order (FR-A-05, BR-21). Create only: there is
 * no route to edit or delete an order (FR-A-12). Names, codes and prices come
 * from the catalogue on the server, never from the request.
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
    details?: unknown;
    cart?: unknown;
    ref?: unknown;
  } | null;
  const details = readDetails(body?.details);
  const cart = sanitizeCart(body?.cart);
  // The reference the customer already has in WhatsApp; a malformed one is
  // replaced rather than stored
  const ref = isOrderRef(body?.ref) ? body.ref : generateOrderRef();

  if (!details || validateCheckout(details, cart) !== null) {
    return NextResponse.json(
      { success: false, error: "The order is incomplete." },
      { status: 400 }
    );
  }

  const items = Object.entries(cart).map(([id, qty]) => ({
    code: productCode(id),
    name: getProduct(id)!.name.en,
    qty,
    price: getProduct(id)!.price,
    lineTotal: lineTotal(id, qty),
  }));

  try {
    const doc = await userOrders(uid).add({
      ref,
      ...details,
      items,
      total: cartTotal(cart),
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, id: doc.id, ref });
  } catch (error) {
    console.error("Order save error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to save the order." },
      { status: 500 }
    );
  }
}
