"use client";

import Link from "next/link";
import { useCart } from "@/contexts/cart-context";
import { useLanguage } from "@/contexts/language-context";
import {
  cartTotal,
  formatLKR,
  getProduct,
  lineTotal,
  productCode,
} from "@/lib/products";
import { isPlaceholderNumber } from "@/lib/shop-config";
import QtyControl from "../ui/QtyControl";
import { btnPrimary, card, heading } from "../ui/styles";
import CheckoutForm from "./CheckoutForm";

export default function CartView() {
  const { t, l } = useLanguage();
  const { cart, setQty, remove } = useCart();
  const entries = Object.entries(cart).filter(([id]) => getProduct(id));

  return (
    <div className="space-y-4">
      <h1 className={heading}>{t("cart.title")}</h1>

      {isPlaceholderNumber() && (
        <p
          role="alert"
          className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
        >
          ⚠️ {t("ownerWarning")}
        </p>
      )}

      {entries.length === 0 ? (
        <div className={`${card} text-center`}>
          <p className="mb-4 text-gray-700">{t("cart.empty")}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/shop" className={btnPrimary}>
              {t("nav.shop")}
            </Link>
            <Link href="/" className={btnPrimary}>
              {t("nav.planner")}
            </Link>
          </div>
        </div>
      ) : (
        <>
          <ul className={`${card} divide-y divide-green-50 !p-0`}>
            {entries.map(([id, qty]) => {
              const product = getProduct(id)!;
              const name = l(product.name);

              return (
                <li key={id} className="flex flex-wrap items-center gap-3 p-4">
                  <span className="text-2xl" aria-hidden="true">
                    {product.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">{name}</p>
                    <p className="text-xs text-gray-600">
                      <code>{productCode(id)}</code> · {formatLKR(product.price)}
                    </p>
                  </div>
                  <QtyControl
                    qty={qty}
                    label={name}
                    onChange={(next) => setQty(id, next)}
                  />
                  <p className="w-24 text-right font-semibold">
                    {formatLKR(lineTotal(id, qty))}
                  </p>
                  <button
                    type="button"
                    onClick={() => remove(id)}
                    className="text-sm text-red-700 underline"
                  >
                    {t("remove")}
                  </button>
                </li>
              );
            })}
            <li className="flex items-center justify-between bg-green-50 p-4 font-bold text-green-900">
              <span>{t("cart.total")}</span>
              <span>{formatLKR(cartTotal(cart))}</span>
            </li>
          </ul>

          <p className="text-sm">
            📖{" "}
            <Link href="/guides" className="font-medium text-green-800 underline">
              {t("cart.guides")}
            </Link>
          </p>

          <CheckoutForm />
        </>
      )}
    </div>
  );
}
