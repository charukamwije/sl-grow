"use client";

import { FormEvent, useState } from "react";
import { useCart } from "@/contexts/cart-context";
import { useLanguage } from "@/contexts/language-context";
import { useNotification } from "@/contexts/notification-context";
import { useSession } from "@/contexts/session-context";
import type { StringKey } from "@/lib/i18n/strings";
import {
  buildOrderMessage,
  validateCheckout,
  waLink,
  type CheckoutDetails,
  type CheckoutError,
  type CheckoutMethod,
} from "@/lib/order/whatsapp";
import Segmented from "../ui/Segmented";
import TextField from "../ui/TextField";
import { card, subheading } from "../ui/styles";

const ERROR_KEYS: Record<CheckoutError, StringKey> = {
  nameAndPhone: "err.nameAndPhone",
  address: "err.address",
  emptyCart: "err.emptyCart",
};

const EMPTY: CheckoutDetails = {
  name: "",
  phone: "",
  method: "pickup",
  address: "",
  notes: "",
};

/**
 * Collects the customer's details and opens WhatsApp with the order
 * (FR-O-01 to FR-O-04). A guest's details only ever go into the message; a
 * signed-in customer's order is also saved to their account (FR-A-05). The
 * details are not kept after the page closes (SRS 4.5).
 */
export default function CheckoutForm() {
  const { t } = useLanguage();
  const { cart } = useCart();
  const { user } = useSession();
  const { addErrorNotification, addSuccessNotification, addInfoNotification } =
    useNotification();
  const [details, setDetails] = useState<CheckoutDetails>(EMPTY);

  const update = (field: keyof CheckoutDetails, value: string) =>
    setDetails((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const error = validateCheckout(details, cart);
    if (error) {
      addErrorNotification(t(ERROR_KEYS[error]));
      return;
    }

    // Opened synchronously inside the click so mobile popup blockers allow
    // it; the account save below runs alongside instead of before
    window.open(waLink(buildOrderMessage(details, cart)), "_blank", "noopener");
    addInfoNotification(t("orderOpened"));

    if (user) {
      fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ details, cart }),
        // Finishes even if the customer leaves for WhatsApp straight away
        keepalive: true,
      })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok || !data.success) throw new Error(data.error);
          addSuccessNotification(t("orderSaved"));
        })
        .catch((saveError) => {
          console.error("Order save error:", saveError);
          addErrorNotification(t("orderSaveFailed"));
        });
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`${card} space-y-4`} noValidate>
      <h2 className={`${subheading} !mb-1`}>{t("checkout.title")}</h2>

      <Segmented<CheckoutMethod>
        name="method"
        legend={t("checkout.method")}
        value={details.method}
        onChange={(method) => update("method", method)}
        options={[
          { value: "pickup", label: t("checkout.pickup"), icon: "🏪" },
          { value: "delivery", label: t("checkout.delivery"), icon: "🚚" },
        ]}
      />

      <TextField
        id="checkout-name"
        label={t("checkout.name")}
        value={details.name}
        onChange={(value) => update("name", value)}
        autoComplete="name"
        maxLength={200}
        required
      />
      <TextField
        id="checkout-phone"
        type="tel"
        label={t("checkout.phone")}
        value={details.phone}
        onChange={(value) => update("phone", value)}
        autoComplete="tel"
        maxLength={200}
        required
      />

      {details.method === "delivery" && (
        <TextField
          id="checkout-address"
          label={t("checkout.address")}
          value={details.address}
          onChange={(value) => update("address", value)}
          autoComplete="street-address"
          maxLength={1000}
          multiline
          required
          hint={t("checkout.deliveryNote")}
        />
      )}

      <TextField
        id="checkout-notes"
        label={t("checkout.notes")}
        value={details.notes}
        onChange={(value) => update("notes", value)}
        maxLength={1000}
        multiline
        rows={2}
      />

      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1ebe5a] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
          <path d="M12.04 2a9.9 9.9 0 0 0-8.5 15l-1.3 4.8 4.9-1.3A9.9 9.9 0 1 0 12.04 2Zm5.8 14.1c-.25.7-1.44 1.33-2 1.38-.52.05-1 .25-3.4-.7a11.6 11.6 0 0 1-4.5-4c-.33-.45-1.08-1.45-1.08-2.77s.7-1.97.94-2.24a1 1 0 0 1 .72-.34h.52c.17 0 .4-.06.62.47l.86 2.08a.5.5 0 0 1 .02.48l-.32.52-.47.52c-.16.16-.32.33-.14.65a9.6 9.6 0 0 0 1.76 2.18 8.6 8.6 0 0 0 2.55 1.57c.32.16.5.13.69-.08l.92-1.07c.2-.32.4-.26.66-.16l2.07.97c.3.15.5.22.57.34.07.13.07.72-.18 1.42Z" />
        </svg>
        {t("checkout.send")}
      </button>

      <p className="text-xs leading-relaxed text-gray-500">{t("checkout.privacy")}</p>
    </form>
  );
}
