// Fails the build if this module is ever pulled into a client bundle
import "server-only";
import { adminDb } from "./supabase/admin";
import { DatabaseError } from "./supabase/store";

/** Private: transfer slips show customers' bank details (0006_checkout.sql) */
export const RECEIPT_BUCKET = "payment-receipts";

// Long enough to open and read the slip, short enough that a copied link dies
const SIGNED_URL_SECONDS = 10 * 60;

/**
 * Stores a customer's transfer slip on their order, replacing an earlier one.
 * The order row is only updated while it still takes a slip - the customer's
 * own, by bank transfer, not cancelled and not yet paid - so a slip cannot
 * land on an order an admin has just closed. Returns false when it did not.
 */
export async function attachReceipt(
  uid: string,
  orderId: string,
  bytes: Uint8Array,
  type: string,
  ext: string
): Promise<boolean> {
  const previous = await adminDb
    .from("orders")
    .select("receipt_path")
    .eq("id", orderId)
    .eq("user_id", uid)
    .maybeSingle<{ receipt_path: string | null }>();

  if (previous.error) {
    throw new DatabaseError(previous.error.message, previous.error.code ?? "", previous.status);
  }
  if (!previous.data) return false;

  const path = `${orderId}/${crypto.randomUUID()}.${ext}`;
  const upload = await adminDb.storage
    .from(RECEIPT_BUCKET)
    .upload(path, bytes, { contentType: type, upsert: false });

  if (upload.error) throw new Error(`Slip upload failed: ${upload.error.message}`);

  const { data, error, status } = await adminDb
    .from("orders")
    .update({ receipt_path: path, receipt_uploaded_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("user_id", uid)
    .eq("payment_method", "bank_transfer")
    .eq("paid", false)
    .neq("status", "cancelled")
    .select("id");

  if (error || (data ?? []).length === 0) {
    await removeReceipts([path]);
    if (error) throw new DatabaseError(error.message, error.code ?? "", status);
    return false;
  }

  if (previous.data.receipt_path) await removeReceipts([previous.data.receipt_path]);
  return true;
}

/** A link to view a slip, valid for ten minutes, for the admin console */
export async function receiptSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await adminDb.storage
    .from(RECEIPT_BUCKET)
    .createSignedUrl(path, SIGNED_URL_SECONDS);

  if (error) {
    console.error("Slip link error:", error);
    return null;
  }
  return data.signedUrl;
}

// A leftover file costs storage, not correctness, so it is logged, not thrown
async function removeReceipts(paths: string[]): Promise<void> {
  const { error } = await adminDb.storage.from(RECEIPT_BUCKET).remove(paths);
  if (error) console.error("Slip removal error:", error, paths);
}
