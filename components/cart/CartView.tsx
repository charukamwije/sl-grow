"use client";

import Link from "next/link";
import { BookOpenIcon, TrashIcon } from "@heroicons/react/24/outline";
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
import { btnPrimary, btnSecondary, card, heading } from "../ui/styles";
import CheckoutForm from "./CheckoutForm";

export default function CartView() {
  const { t, l } = useLanguage();
  const { cart, count, setQty, remove } = useCart();
  const entries = Object.entries(cart).filter(([id]) => getProduct(id));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <h1 className={heading}>{t("cart.title")}</h1>
        {entries.length > 0 && (
          <p className="text-sm text-gray-500">{t("cart.items", { n: count })}</p>
        )}
      </div>

      {isPlaceholderNumber() && (
        <p
          role="alert"
          className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200"
        >
          ⚠️ {t("ownerWarning")}
        </p>
      )}

      {entries.length === 0 ? (
        <div className={`${card} flex flex-col items-center gap-4 py-12 text-center`}>
          <span className="text-6xl" aria-hidden="true">🧺</span>
          <p className="max-w-sm text-gray-600">{t("cart.empty")}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/shop" className={btnPrimary}>
              {t("nav.shop")}
            </Link>
            <Link href="/" className={btnSecondary}>
              {t("nav.planner")}
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
          <div className="space-y-3">
            <ul className="space-y-3">
              {entries.map(([id, qty]) => {
                const product = getProduct(id)!;
                const name = l(product.name);

                return (
                  <li
                    key={id}
                    className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5"
                  >
                    <span
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-3xl"
                      aria-hidden="true"
                    >
                      {product.icon}
                    </span>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">{name}</p>
                          <p className="text-xs text-gray-500">
                            <code>{productCode(id)}</code> · {formatLKR(product.price)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(id)}
                          className="shrink-0 rounded-full p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <TrashIcon className="h-5 w-5" aria-hidden="true" />
                          <span className="sr-only">
                            {t("remove")} {name}
                          </span>
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <QtyControl
                          qty={qty}
                          label={name}
                          onChange={(next) => setQty(id, next)}
                        />
                        <p className="font-semibold text-gray-900">
                          {formatLKR(lineTotal(id, qty))}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <Link
              href="/guides"
              className="flex items-center gap-3 rounded-3xl bg-emerald-50 p-4 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100"
            >
              <BookOpenIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
              {t("cart.guides")}
            </Link>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-36">
            <div className={card}>
              <p className="text-sm font-medium text-gray-500">{t("cart.summary")}</p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-sm text-gray-700">{t("cart.total")}</span>
                <span className="text-2xl font-bold text-gray-900">
                  {formatLKR(cartTotal(cart))}
                </span>
              </div>
            </div>
            <CheckoutForm />
          </aside>
        </div>
      )}
    </div>
  );
}
