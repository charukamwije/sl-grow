import type { Metadata } from "next";
import Link from "next/link";
import ProductForm from "@/components/admin/ProductForm";
import { btnGhost, heading, muted } from "@/components/ui/styles";
import { requireRole } from "@/lib/supabase/admin-auth";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireRole("admin");

  return (
    <>
      <Link href="/admin/products" className={btnGhost}>
        ← Products
      </Link>
      <h1 className={heading}>New product</h1>
      <p className={muted}>You can add a photo once the product is created.</p>
      <ProductForm />
    </>
  );
}
