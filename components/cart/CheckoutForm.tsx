"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import { useLanguage } from "@/contexts/language-context";
import { useNotification } from "@/contexts/notification-context";
import { useSession } from "@/contexts/session-context";
import type { StringKey } from "@/lib/i18n/strings";
import {
  validateCheckout,
  type CheckoutDetails,
  type CheckoutError,
  type CheckoutMethod,
  type PaymentMethod,
} from "@/lib/order/checkout";
import GoogleIcon from "../icons/GoogleIcon";
import Loading from "../icons/Loading";
import Segmented from "../ui/Segmented";
import TextField from "../ui/TextField";
import { btnPrimary, card, subheading } from "../ui/styles";

const ERROR_KEYS: Record<CheckoutError, StringKey> = {
  nameAndPhone: "err.nameAndPhone",
  address: "err.address",
  emptyCart: "err.emptyCart",
};

const EMPTY: CheckoutDetails = {
  name: "",
  phone: "",
  method: "delivery",
  payment: "cod",
  address: "",
  notes: "",
};

/** Guests see this instead of the form: placing an order needs an account */
function SignInToOrder() {
  const { t } = useLanguage();
  const { accountsEnabled } = useSession();
  const { signInWithGoogle, loadingProvider, isAuthLoading } = useAuth();

  return (
    <section id="checkout" className={`${card} scroll-mt-24 space-y-3`}>
      <h2 className={`${subheading} !mb-1`}>
        {accountsEnabled ? t("checkout.signInTitle") : t("checkout.title")}
      </h2>
      {accountsEnabled ? (
        <>
          <p className="text-sm leading-relaxed text-gray-600">{t("checkout.signInText")}</p>
          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            disabled={isAuthLoading}
            className="flex w-full items-center justify-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 shadow-sm transition hover:shadow-md disabled:opacity-60"
          >
            {loadingProvider === "google" ? <Loading size="small" color="black" /> : <GoogleIcon />}
            {t("signInGoogle")}
          </button>
        </>
      ) : (
        <p className="text-sm leading-relaxed text-gray-600">{t("checkout.unavailable")}</p>
      )}
    </section>
  );
}

/**
 * Places the signed-in customer's order (FR-O-01 to FR-O-03): pickup or
 * delivery, paid by cash or bank transfer. The server prices the cart and
 * makes the reference; the customer then lands on the order's own page.
 */
export default function CheckoutForm() {
  const { user } = useSession();

  return user ? <MemberCheckout /> : <SignInToOrder />;
}

function MemberCheckout() {
  const { t } = useLanguage();
  const router = useRouter();
  const { cart, clear } = useCart();
  const { user } = useSession();
  const { addErrorNotification } = useNotification();
  const [details, setDetails] = useState<CheckoutDetails>(() => ({
    ...EMPTY,
    name: user?.displayName ?? "",
  }));
  const [placing, setPlacing] = useState(false);

  const update = <K extends keyof CheckoutDetails>(field: K, value: CheckoutDetails[K]) =>
    setDetails((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (placing) return;

    const error = validateCheckout(details, cart);
    if (error) {
      addErrorNotification(t(ERROR_KEYS[error]));
      return;
    }

    setPlacing(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ details, cart }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success || typeof data.id !== "string") {
        throw new Error(data?.error || "Order failed");
      }

      clear();
      router.push(`/account/orders/${data.id}?placed=1`);
    } catch (placeError) {
      console.error("Order error:", placeError);
      addErrorNotification(t("checkout.placeFailed"));
      setPlacing(false);
    }
  };

  return (
    <form
      id="checkout"
      onSubmit={handleSubmit}
      className={`${card} scroll-mt-24 space-y-4`}
      noValidate
    >
      <h2 className={`${subheading} !mb-1`}>{t("checkout.title")}</h2>

      <Segmented<CheckoutMethod>
        name="method"
        legend={t("checkout.method")}
        value={details.method}
        onChange={(method) => update("method", method)}
        options={[
          { value: "delivery", label: t("checkout.delivery"), icon: "🚚" },
          { value: "pickup", label: t("checkout.pickup"), icon: "🏪" },
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

      <div className="space-y-2">
        <Segmented<PaymentMethod>
          name="payment"
          legend={t("checkout.payment")}
          showLegend
          value={details.payment}
          onChange={(payment) => update("payment", payment)}
          options={[
            {
              value: "cod",
              label: details.method === "pickup" ? t("pay.atPickup") : t("pay.cod"),
              icon: "💵",
            },
            { value: "bank_transfer", label: t("pay.bank"), icon: "🏦" },
          ]}
        />
        {details.payment === "bank_transfer" && (
          <p className="text-xs leading-relaxed text-gray-500">{t("pay.bankHint")}</p>
        )}
      </div>

      <TextField
        id="checkout-notes"
        label={t("checkout.notes")}
        value={details.notes}
        onChange={(value) => update("notes", value)}
        maxLength={1000}
        multiline
        rows={2}
      />

      <button type="submit" className={`${btnPrimary} w-full py-3.5`} disabled={placing}>
        {placing && <Loading size="small" color="white" />}
        {placing ? t("checkout.placing") : t("checkout.place")}
      </button>

      <p className="text-xs leading-relaxed text-gray-500">{t("checkout.memberPrivacy")}</p>
    </form>
  );
}
