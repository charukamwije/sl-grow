import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DeleteProductButton from "@/components/admin/DeleteProductButton";
import ProductForm from "@/components/admin/ProductForm";
import ProductImageForm from "@/components/admin/ProductImageForm";
import { btnGhost, card, heading, muted, subheading } from "@/components/ui/styles";
import { getAdminProduct } from "@/lib/admin-products";
import { productCode } from "@/lib/products";
import { getProtectedProductIds } from "@/lib/guides-server";
import { requireRole } from "@/lib/supabase/admin-auth";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole("admin");

  const { id } = await params;
  const product = await getAdminProduct(id);
  if (!product) notFound();

  const created = (await searchParams).created === "1";
  const isProtected = (await getProtectedProductIds()).has(product.id);

  return (
    <>
      <Link href="/admin/products" className={btnGhost}>
        ← Products
      </Link>
      <div>
        <h1 className={heading}>{product.name.en}</h1>
        <p className={muted}>
          <code>{productCode(product.id)}</code>
          {product.active ? " · In the shop" : " · Hidden from the shop"}
        </p>
      </div>

      {created && (
        <p role="status" className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-800">
          Product created. Add a photo below if you have one.
        </p>
      )}

      <ProductForm product={product} isProtected={isProtected} />
      <ProductImageForm id={product.id} icon={product.icon} imageUrl={product.imageUrl} />

      <section className={`${card} space-y-3`}>
        <h2 className={subheading}>Delete</h2>
        {isProtected ? (
          <p className={muted}>
            The planner or a grow guide uses this product, so it cannot be deleted.
          </p>
        ) : (
          <DeleteProductButton id={product.id} name={product.name.en} />
        )}
      </section>
    </>
  );
}
