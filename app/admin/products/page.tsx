import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "@heroicons/react/20/solid";
import { btnPrimary, card, heading, input, muted } from "@/components/ui/styles";
import { listAdminProducts } from "@/lib/admin-products";
import { CATEGORIES } from "@/lib/data/products";
import { formatLKR, productCode } from "@/lib/products";
import { getProtectedProductIds } from "@/lib/guides-server";
import { requireRole } from "@/lib/supabase/admin-auth";

export const metadata: Metadata = { title: "Products" };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole("admin");

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const category =
    typeof params.category === "string" &&
    (CATEGORIES as readonly string[]).includes(params.category)
      ? params.category
      : "";

  const [all, protectedIds] = await Promise.all([listAdminProducts(), getProtectedProductIds()]);
  const products = all.filter(
    (product) =>
      (!category || product.category === category) &&
      (!q ||
        product.id.includes(q) ||
        productCode(product.id).toLowerCase().includes(q) ||
        Object.values(product.name).some((name) => name.toLowerCase().includes(q)))
  );
  const hidden = all.filter((product) => !product.active).length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={heading}>Products</h1>
          <p className={muted}>
            {all.length} products{hidden > 0 ? `, ${hidden} hidden from the shop` : ""}.
          </p>
        </div>
        <Link href="/admin/products/new" className={btnPrimary}>
          <PlusIcon className="h-5 w-5" aria-hidden="true" />
          New product
        </Link>
      </div>

      <form className="flex flex-col gap-2 sm:flex-row" role="search">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name or code"
          aria-label="Search products"
          className={input}
        />
        <select
          name="category"
          defaultValue={category}
          aria-label="Category"
          className={`${input} sm:w-48`}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <button type="submit" className={`${btnPrimary} sm:w-auto`}>
          Filter
        </button>
      </form>

      <div className={`${card} overflow-x-auto p-0 sm:p-0`}>
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="border-b border-black/5 text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 text-right font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {products.map((product) => (
              <tr key={product.id} className={product.active ? "" : "text-gray-500"}>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="flex items-center gap-3 hover:text-emerald-700"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-50 text-xl">
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span aria-hidden="true">{product.icon}</span>
                      )}
                    </span>
                    <span>
                      <span className="block font-medium">{product.name.en}</span>
                      <code className="text-xs text-gray-500">{productCode(product.id)}</code>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3">{product.category}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatLKR(product.price)} / {product.unit}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      product.active ? "bg-emerald-50 text-emerald-800" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {product.active ? "In shop" : "Hidden"}
                  </span>
                  {protectedIds.has(product.id) && (
                    <span
                      className="ml-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800"
                      title="The planner or a grow guide uses it, so it cannot be hidden or deleted"
                    >
                      Used by planner
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  No products match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
