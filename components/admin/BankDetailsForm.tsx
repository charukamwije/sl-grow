"use client";

import { useActionState } from "react";
import { updateBankDetails, type SettingsState } from "@/app/admin/settings/actions";
import Loading from "@/components/icons/Loading";
import { btnPrimary, card, input, label, muted } from "@/components/ui/styles";
import type { BankDetails } from "@/lib/shop-settings";

const FIELDS: { name: keyof BankDetails; label: string; placeholder: string }[] = [
  { name: "bankName", label: "Bank", placeholder: "e.g. Commercial Bank" },
  { name: "branch", label: "Branch", placeholder: "e.g. Kandy" },
  { name: "accountName", label: "Account name", placeholder: "e.g. Aswedduma (Pvt) Ltd" },
  { name: "accountNumber", label: "Account number", placeholder: "e.g. 1234567890" },
];

export default function BankDetailsForm({ details }: { details: BankDetails }) {
  const [state, formAction, pending] = useActionState<SettingsState, FormData>(
    updateBankDetails,
    {}
  );

  return (
    <form action={formAction} className={`${card} space-y-4`}>
      <p className={muted}>
        Shown to customers who choose bank transfer, with their order reference as the payment
        note. Until the bank, account name and account number are all filled in, customers are
        told the shop will give the details by phone.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <div key={field.name}>
            <label htmlFor={field.name} className={label}>
              {field.label}
            </label>
            <input
              id={field.name}
              name={field.name}
              defaultValue={details[field.name]}
              placeholder={field.placeholder}
              maxLength={120}
              className={input}
            />
          </div>
        ))}
      </div>
      <div>
        <label htmlFor="note" className={label}>
          Note for customers (optional)
        </label>
        <textarea
          id="note"
          name="note"
          defaultValue={details.note}
          maxLength={500}
          placeholder="e.g. Upload your slip within 2 days so we can send your order."
          className={`${input} min-h-20`}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className={btnPrimary} disabled={pending}>
          {pending && <Loading size="small" color="white" />}
          Save bank details
        </button>
        {state.saved && (
          <p role="status" className="text-sm text-emerald-700">
            Saved. Customers see the new details now.
          </p>
        )}
        {state.error && (
          <p role="alert" className="text-sm text-red-700">
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}
