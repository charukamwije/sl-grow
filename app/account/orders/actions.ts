"use server";

import { revalidatePath } from "next/cache";
import type { StringKey } from "@/lib/i18n/strings";
import { acceptsReceipt } from "@/lib/order/checkout";
import { attachReceipt } from "@/lib/receipts";
import { loadOwnOrder } from "@/lib/supabase/account";
import { getServerSession } from "@/lib/supabase/auth-server";
import { checkReceipt, type UploadError } from "@/lib/uploads";

/** Errors are string keys, so the form shows them in the customer's language */
export type ReceiptResult = { ok: true } | { ok: false, error: StringKey };

const UPLOAD_ERRORS: Record<UploadError, StringKey> = {
  empty: "receipt.errEmpty",
  tooLarge: "receipt.errSize",
  type: "receipt.errType",
};

/**
 * A customer sends the slip for their own bank transfer order. Only the
 * order's owner, and only while it is open and unpaid; admins then check the
 * bank and mark it paid.
 */
export async function uploadReceipt(
  orderId: string,
  _previous: ReceiptResult | null,
  form: FormData
): Promise<ReceiptResult> {
  const session = await getServerSession();
  if (session.state !== "valid") return { ok: false, error: "receipt.errFailed" };
  const { uid } = session.user;

  const file = form.get("receipt");
  if (!(file instanceof File)) return { ok: false, error: "receipt.errEmpty" };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const checked = checkReceipt(bytes);
  if (checked.error) return { ok: false, error: UPLOAD_ERRORS[checked.error] };

  try {
    const order = await loadOwnOrder(uid, orderId);
    if (!order || !acceptsReceipt(order)) return { ok: false, error: "receipt.errClosed" };

    if (!(await attachReceipt(uid, orderId, bytes, checked.type, checked.ext))) {
      return { ok: false, error: "receipt.errClosed" };
    }
  } catch (error) {
    console.error("Slip upload error:", error);
    return { ok: false, error: "receipt.errFailed" };
  }

  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath("/admin/orders");

  return { ok: true };
}
