"use server";

import { revalidatePath } from "next/cache";
import { parseBankDetails, saveBankDetails } from "@/lib/shop-settings";
import { audit, authorizeAction } from "@/lib/supabase/admin-auth";

export type SettingsState = { error?: string; saved?: boolean };

/** The bank details bank transfer customers see (super admins only) */
export async function updateBankDetails(
  _previous: SettingsState,
  form: FormData
): Promise<SettingsState> {
  const auth = await authorizeAction("super_admin");
  if (!auth.user) return { error: auth.error };

  const parsed = parseBankDetails(form);
  if (!parsed.details) return { error: parsed.error };

  try {
    await saveBankDetails(parsed.details, auth.user.uid);
  } catch (error) {
    console.error("Bank details error:", error);
    return { error: "Failed to save the bank details." };
  }

  // The account number is the change that matters if one is ever disputed
  await audit(auth.user, "settings.bank_details_changed", "shop_settings", {
    bankName: parsed.details.bankName,
    accountNumber: parsed.details.accountNumber,
  });
  revalidatePath("/admin/settings");

  return { saved: true };
}
