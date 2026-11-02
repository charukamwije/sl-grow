"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/contexts/cart-context";
import { useLanguage } from "@/contexts/language-context";
import { useNotification } from "@/contexts/notification-context";
import { guideForVeg } from "@/lib/data/guides";
import { CATEGORIES, PRODUCTS, type Category } from "@/lib/data/products";
import { formatLKR, productCode } from "@/lib/products";
import QtyControl from "../ui/QtyControl";
import { btnPrimary, heading, input } from "../ui/styles";

export default function ShopView() {
  const { lang, t, l } = useLanguage();
  const { cart, add, setQty } = useCart();
  const { addSuccessNotification } = useNotification();
  const [category, setCategory] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");

  // FR-S-02: by category, and by name in the current language or English
  const products = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return PRODUCTS.filter(
      (product) =>
        (category === "all" || product.category === category) &&
        (!q ||
          product.name[lang].toLocaleLowerCase().includes(q) ||
          product.name.en.toLowerCase().includes(q) ||
          productCode(product.id).toLowerCase().includes(q))
    );
  }, [category, query, lang]);

  return (
    <div className="space-y-4">
      <h1 className={heading}>{t("shop.title")}</h1>

      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("shop.search")}
        aria-label={t("shop.search")}
        className={input}
      />

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {(["all", ...CATEGORIES] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            aria-pressed={category === cat}
            className={`whitespace-nowrap rounded-full border px-3 py-1 text-sm ${
              category === cat
                ? "border-green-700 bg-green-700 text-white"
                : "border-green-200 bg-white text-green-900 hover:bg-green-50"
            }`}
          >
            {t(`cat.${cat}`)}
          </button>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-center text-gray-600">
          {t("noProducts")}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const qty = cart[product.id] ?? 0;
            const guide = product.vegId ? guideForVeg(product.vegId) : undefined;
            const name = l(product.name);

            return (
              <li
                key={product.id}
                className="flex flex-col rounded-xl border border-green-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl" aria-hidden="true">
                    {product.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-gray-900">{name}</h2>
                    <p className="text-xs text-gray-600">
                      {t(`cat.${product.category}`)} ·{" "}
                      <code>{productCode(product.id)}</code>
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-1 items-end justify-between gap-2">
                  <p>
                    <span className="text-lg font-bold text-green-900">
                      {formatLKR(product.price)}
                    </span>
                    <span className="text-xs text-gray-600">
                      {" "}
                      / {t(`unit.${product.unit}`)}
                    </span>
                  </p>

                  {qty > 0 ? (
                    <QtyControl
                      qty={qty}
                      label={name}
                      onChange={(next) => setQty(product.id, next)}
                    />
                  ) : (
                    <button
                      type="button"
                      className={btnPrimary}
                      onClick={() => {
                        add(product.id);
                        addSuccessNotification(t("added", { name }));
                      }}
                    >
                      {t("add")}
                    </button>
                  )}
                </div>

                {guide && (
                  <Link
                    href={`/guides/${guide.id}`}
                    className="mt-3 text-sm font-medium text-green-800 underline"
                  >
                    📖 {t("growGuide")}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
