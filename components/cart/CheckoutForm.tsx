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
} from "@/lib/order/whatsapp";
import { btnPrimary, card, input, label, muted, subheading } from "../ui/styles";

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
      <h2 className={subheading}>{t("checkout.title")}</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="checkout-name" className={label}>
            {t("checkout.name")} *
          </label>
          <input
            id="checkout-name"
            className={input}
            value={details.name}
            onChange={(event) => update("name", event.target.value)}
            autoComplete="name"
            maxLength={200}
            required
          />
        </div>
        <div>
          <label htmlFor="checkout-phone" className={label}>
            {t("checkout.phone")} *
          </label>
          <input
            id="checkout-phone"
            type="tel"
            className={input}
            value={details.phone}
            onChange={(event) => update("phone", event.target.value)}
            autoComplete="tel"
            maxLength={200}
            required
          />
        </div>
      </div>

      <fieldset>
        <legend className={label}>{t("checkout.method")}</legend>
        <div className="flex flex-wrap gap-4">
          {(["pickup", "delivery"] as const).map((method) => (
            <label key={method} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="method"
                value={method}
                checked={details.method === method}
                onChange={() => update("method", method)}
                className="accent-green-700"
              />
              {t(`checkout.${method}`)}
            </label>
          ))}
        </div>
      </fieldset>

      {details.method === "delivery" && (
        <div>
          <label htmlFor="checkout-address" className={label}>
            {t("checkout.address")} *
          </label>
          <textarea
            id="checkout-address"
            className={input}
            rows={3}
            value={details.address}
            onChange={(event) => update("address", event.target.value)}
            autoComplete="street-address"
            maxLength={1000}
          />
          <p className={`${muted} mt-1`}>{t("checkout.deliveryNote")}</p>
        </div>
      )}

      <div>
        <label htmlFor="checkout-notes" className={label}>
          {t("checkout.notes")}
        </label>
        <textarea
          id="checkout-notes"
          className={input}
          rows={2}
          value={details.notes}
          onChange={(event) => update("notes", event.target.value)}
          maxLength={1000}
        />
      </div>

      <button type="submit" className={`${btnPrimary} w-full sm:w-auto`}>
        💬 {t("checkout.send")}
      </button>

      <p className="text-xs text-gray-600">{t("checkout.privacy")}</p>
    </form>
  );
}
