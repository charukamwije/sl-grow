// Fails the build if this module is ever pulled into a client bundle
import "server-only";
import { adminDb } from "./supabase/admin";
import { isSupabaseConfigured } from "./supabase/config";
import { DatabaseError } from "./supabase/store";

/** What bank transfer customers are shown (shop_settings, 0006_checkout.sql) */
export type BankDetails = {
  bankName: string;
  branch: string;
  accountName: string;
  accountNumber: string;
  /** Anything else the shop wants to say, e.g. "Send the slip within 2 days" */
  note: string;
};

export const EMPTY_BANK_DETAILS: BankDetails = {
  bankName: "",
  branch: "",
  accountName: "",
  accountNumber: "",
  note: "",
};

/** Enough to pay with: the customer page falls back to "the shop will call" */
export function hasBankDetails(details: BankDetails): boolean {
  return Boolean(details.accountName && details.accountNumber && details.bankName);
}

type Row = {
  bank_name: string;
  bank_branch: string;
  account_name: string;
  account_number: string;
  bank_note: string;
};

export async function getBankDetails(): Promise<BankDetails> {
  if (!isSupabaseConfigured()) return EMPTY_BANK_DETAILS;

  const { data, error, status } = await adminDb
    .from("shop_settings")
    .select("bank_name, bank_branch, account_name, account_number, bank_note")
    .eq("id", 1)
    .maybeSingle<Row>();

  if (error) throw new DatabaseError(error.message, error.code ?? "", status);
  if (!data) return EMPTY_BANK_DETAILS;

  return {
    bankName: data.bank_name,
    branch: data.bank_branch,
    accountName: data.account_name,
    accountNumber: data.account_number,
    note: data.bank_note,
  };
}

export async function saveBankDetails(details: BankDetails, actorId: string): Promise<void> {
  const { error, status } = await adminDb.from("shop_settings").upsert({
    id: 1,
    bank_name: details.bankName,
    bank_branch: details.branch,
    account_name: details.accountName,
    account_number: details.accountNumber,
    bank_note: details.note,
    updated_at: new Date().toISOString(),
    updated_by: actorId,
  });

  if (error) throw new DatabaseError(error.message, error.code ?? "", status);
}

const MAX_FIELD = 120;
const MAX_NOTE = 500;

/** Reads the settings form; every field may be empty, none may be too long */
export function parseBankDetails(
  form: FormData
): { details: BankDetails; error?: never } | { details?: never; error: string } {
  const read = (key: string) => {
    const value = form.get(key);
    return typeof value === "string" ? value.trim() : "";
  };

  const details: BankDetails = {
    bankName: read("bankName"),
    branch: read("branch"),
    accountName: read("accountName"),
    accountNumber: read("accountNumber"),
    note: read("note"),
  };

  const tooLong =
    [details.bankName, details.branch, details.accountName, details.accountNumber].some(
      (value) => value.length > MAX_FIELD
    ) || details.note.length > MAX_NOTE;

  if (tooLong) {
    return { error: `Keep each field under ${MAX_FIELD} characters and the note under ${MAX_NOTE}.` };
  }

  return { details };
}
