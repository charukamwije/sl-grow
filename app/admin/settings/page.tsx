import type { Metadata } from "next";
import BankDetailsForm from "@/components/admin/BankDetailsForm";
import { heading, muted } from "@/components/ui/styles";
import { getBankDetails } from "@/lib/shop-settings";
import { requireRole } from "@/lib/supabase/admin-auth";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  await requireRole("super_admin");

  return (
    <>
      <div>
        <h1 className={heading}>Settings</h1>
        <p className={muted}>Only super admins can change these.</p>
      </div>
      <BankDetailsForm details={await getBankDetails()} />
    </>
  );
}
