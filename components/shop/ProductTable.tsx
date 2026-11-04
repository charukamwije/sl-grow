"use client";

import { useCatalog } from "@/contexts/catalog-context";
import { useCart } from "@/contexts/cart-context";
import { useLanguage } from "@/contexts/language-context";
import { useNotification } from "@/contexts/notification-context";
import { formatLKR, productCode } from "@/lib/products";
import { btnSmall } from "../ui/styles";

type ProductTableProps = {
  lines: { productId: string; qty: number }[];
  /** Show an Add button per row (guides) instead of quantities (plan) */
  addButtons?: boolean;
};

/**
 * Product lines with name, code and price. The planner's shopping list shows
 * quantities and a total (FR-P-17); a guide's recommended products show an
 * Add button per row (FR-G-05).
 */
export default function ProductTable({ lines, addButtons }: ProductTableProps) {
  const { t, l } = useLanguage();
  const { add } = useCart();
  const { getProduct, lineTotal } = useCatalog();
  const { addSuccessNotification } = useNotification();

  const total = lines.reduce(
    (sum, line) => sum + lineTotal(line.productId, line.qty),
    0
  );

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>{t("col.product")}</th>
            <th>{t("col.code")}</th>
            {!addButtons && <th className="num">{t("col.qty")}</th>}
            <th className="num">{t("col.unitPrice")}</th>
            {addButtons ? <th /> : <th className="num">{t("col.lineTotal")}</th>}
          </tr>
        </thead>
        <tbody>
          {lines.map(({ productId, qty }) => {
            const product = getProduct(productId);
            if (!product) return null;

            return (
              <tr key={productId}>
                <td>
                  <span aria-hidden="true">{product.icon}</span> {l(product.name)}
                </td>
                <td>
                  <code className="text-xs">{productCode(productId)}</code>
                </td>
                {!addButtons && <td className="num">{qty}</td>}
                <td className="num">{formatLKR(product.price)}</td>
                {addButtons ? (
                  <td className="num">
                    <button
                      type="button"
                      className={btnSmall}
                      onClick={() => {
                        add(productId);
                        addSuccessNotification(
                          t("added", { name: l(product.name) })
                        );
                      }}
                    >
                      {t("add")}
                    </button>
                  </td>
                ) : (
                  <td className="num">{formatLKR(lineTotal(productId, qty))}</td>
                )}
              </tr>
            );
          })}
        </tbody>
        {!addButtons && (
          <tfoot>
            <tr>
              <th colSpan={4}>{t("total")}</th>
              <th className="num">{formatLKR(total)}</th>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
