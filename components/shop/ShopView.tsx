"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpenIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { PlusIcon } from "@heroicons/react/20/solid";
import { useCart } from "@/contexts/cart-context";
import { useLanguage } from "@/contexts/language-context";
import { useNotification } from "@/contexts/notification-context";
import { guideForVeg } from "@/lib/data/guides";
import { CATEGORIES, PRODUCTS, type Category } from "@/lib/data/products";
import { formatLKR, productCode } from "@/lib/products";
import QtyControl from "../ui/QtyControl";
import { chip, heading } from "../ui/styles";

const CATEGORY_TINT: Record<Category, string> = {
  seedlings: "bg-emerald-50",
  seeds: "bg-lime-50",
  containers: "bg-sky-50",
  supports: "bg-amber-50",
  fertilizers: "bg-orange-50",
  protection: "bg-rose-50",
  tools: "bg-slate-100",
};

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
    <div className="space-y-5">
      <h1 className={heading}>{t("shop.title")}</h1>

      <div className="sticky top-16 z-10 -mx-4 space-y-3 bg-background/90 px-4 pb-3 pt-1 backdrop-blur">
        <div className="relative">
          <MagnifyingGlassIcon
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("shop.search")}
            aria-label={t("shop.search")}
            className="w-full rounded-full border-0 bg-white py-3 pl-12 pr-4 text-base text-gray-900 sm:text-sm shadow-sm ring-1 ring-black/5 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {(["all", ...CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              aria-pressed={category === cat}
              className={chip(category === cat)}
            >
              {t(`cat.${cat}`)}
            </button>
          ))}
        </div>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-white py-12 text-center shadow-sm ring-1 ring-black/5">
          <span className="text-5xl" aria-hidden="true">🔍</span>
          <p className="text-gray-600">{t("noProducts")}</p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {products.map((product) => {
            const qty = cart[product.id] ?? 0;
            const guide = product.vegId ? guideForVeg(product.vegId) : undefined;
            const name = l(product.name);

            return (
              <li
                key={product.id}
                className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5 transition hover:shadow-md"
              >
                <div
                  className={`relative flex aspect-[4/3] items-center justify-center ${CATEGORY_TINT[product.category]}`}
                >
                  <span
                    className="text-5xl transition group-hover:scale-110 sm:text-6xl"
                    aria-hidden="true"
                  >
                    {product.icon}
                  </span>
                  {guide && (
                    <Link
                      href={`/guides/${guide.id}`}
                      className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-emerald-800 shadow-sm hover:bg-white"
                    >
                      <BookOpenIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      {t("growGuide")}
                    </Link>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
                  <p className="truncate text-[11px] text-gray-500">
                    {t(`cat.${product.category}`)} · <code>{productCode(product.id)}</code>
                  </p>
                  <h2 className="text-sm font-semibold leading-snug text-gray-900">{name}</h2>

                  <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-2">
                    <p className="leading-tight">
                      <span className="font-bold text-gray-900">
                        {formatLKR(product.price)}
                      </span>
                      <span className="block text-[11px] text-gray-500">
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
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
                        onClick={() => {
                          add(product.id);
                          addSuccessNotification(t("added", { name }));
                        }}
                      >
                        <PlusIcon className="h-4 w-4" aria-hidden="true" />
                        {t("add")}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
