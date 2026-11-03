"use client";

import { Fragment } from "react";
import { useLanguage } from "@/contexts/language-context";
import { getProduct, productCode } from "@/lib/products";

/**
 * Renders guide text, turning each `[[product_id]]` into the product's name
 * and code in the current language (FR-G-06). Text is rendered as React
 * children, never as HTML.
 */
export default function ProductText({ text }: { text: string }) {
  const { l } = useLanguage();
  const parts = text.split(/\[\[(\w+)\]\]/);

  return (
    <>
      {parts.map((part, i) => {
        // Odd indexes are the captured product IDs
        if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>;

        const product = getProduct(part);
        if (!product) return <Fragment key={i}>{part}</Fragment>;

        return (
          <Fragment key={i}>
            {/* The product's picture helps readers who struggle with names */}
            <span aria-hidden="true">{product.icon} </span>
            <strong className="font-semibold">{l(product.name)}</strong>{" "}
            <code className="rounded bg-emerald-50 px-1 text-xs text-emerald-700">
              {productCode(part)}
            </code>
          </Fragment>
        );
      })}
    </>
  );
}
