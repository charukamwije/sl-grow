import { NextRequest, NextResponse } from "next/server";
import { resolveUid } from "@/lib/supabase/route-auth";
import { insertOrder } from "@/lib/supabase/store";
import {
  isPaymentMethod,
  validateCheckout,
  type CheckoutDetails,
} from "@/lib/order/checkout";
import { getCatalog } from "@/lib/catalog-server";
import { normalizeMobile } from "@/lib/order/phone";
import { productCode } from "@/lib/products";
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
  // Saved as 947XXXXXXXX, ready for a WhatsApp or SMS link
  const phone = typeof raw.phone === "string" ? normalizeMobile(raw.phone) : null;
  const address = text(raw.address ?? "", MAX_LONG_FIELD);
  const notes = text(raw.notes ?? "", MAX_LONG_FIELD);
  const method = raw.method;
  const payment = raw.payment;

  if (
    name === null ||
    phone === null ||
    address === null ||
    notes === null ||
    (method !== "pickup" && method !== "delivery") ||
    !isPaymentMethod(payment)
  ) {
    return null;
  }

  return {
    name,
    phone,
    method,
    payment,
    address: method === "delivery" ? address : "",
    notes,
  };
}

/**
 * Places a signed-in customer's order (FR-O-01, FR-A-05, BR-21). Guests are
 * asked to sign in first. Names, codes and prices come from the catalogue on
 * the server, never from the request, and so does the order reference. The
 * customer cannot edit or delete an order afterwards (FR-A-12); admins move
 * it through its status.
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
  } | null;
  let catalog: Awaited<ReturnType<typeof getCatalog>>;
  try {
    catalog = await getCatalog();
  } catch (error) {
    console.error("Order catalogue error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to save the order." },
      { status: 500 }
    );
  }

  const { getProduct, lineTotal, cartTotal } = catalog;
  const details = readDetails(body?.details);
  const cart = catalog.sanitizeCart(body?.cart);

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
    const { payment, ...rest } = details;
    const { id, ref } = await insertOrder(uid, {
      ...rest,
      payment_method: payment,
      items,
      total: cartTotal(cart),
    });

    return NextResponse.json({ success: true, id, ref });
  } catch (error) {
    console.error("Order save error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to save the order." },
      { status: 500 }
    );
  }
}
