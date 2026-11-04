import type { Metadata } from "next";
import Link from "next/link";
import { card, heading, muted, subheading } from "@/components/ui/styles";
import { countOrdersNeedingAttention } from "@/lib/admin-orders";
import { countNewApplications } from "@/lib/certifications-server";
import { requireRole } from "@/lib/supabase/admin-auth";
import { hasRole, ROLE_LABELS } from "@/lib/supabase/roles";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const user = await requireRole("admin");
  const [attention, newApplications] = await Promise.all([
    countOrdersNeedingAttention(),
    countNewApplications(),
  ]);

  return (
    <>
      <h1 className={heading}>Admin</h1>
      <p className={muted}>
        Signed in as {user.displayName || user.email} ({ROLE_LABELS[user.role]}).
      </p>

      {/* New orders and applications reach the shop here, not on WhatsApp */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/admin/orders?status=created"
          className={`${card} block transition hover:ring-emerald-300 ${
            attention.created > 0 ? "ring-2 ring-sky-300" : ""
          }`}
        >
          <p className="text-3xl font-bold text-gray-900">{attention.created}</p>
          <p className={muted}>
            New order{attention.created === 1 ? "" : "s"} waiting to be received
          </p>
        </Link>
        <Link
          href="/admin/orders?payment=receipt"
          className={`${card} block transition hover:ring-emerald-300 ${
            attention.receipts > 0 ? "ring-2 ring-amber-300" : ""
          }`}
        >
          <p className="text-3xl font-bold text-gray-900">{attention.receipts}</p>
          <p className={muted}>
            Transfer slip{attention.receipts === 1 ? "" : "s"} to check against the bank
          </p>
        </Link>
        <Link
          href="/admin/certifications?status=applied"
          className={`${card} block transition hover:ring-emerald-300 ${
            newApplications > 0 ? "ring-2 ring-emerald-300" : ""
          }`}
        >
          <p className="text-3xl font-bold text-gray-900">{newApplications}</p>
          <p className={muted}>
            New certification application{newApplications === 1 ? "" : "s"} to review
          </p>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/products" className={`${card} block transition hover:ring-emerald-300`}>
          <h2 className={subheading}>Products</h2>
          <p className={muted}>
            Add products, change prices and names, upload photos, and hide or delete products.
          </p>
        </Link>
        <Link href="/admin/guides" className={`${card} block transition hover:ring-emerald-300`}>
          <h2 className={subheading}>Grow guides</h2>
          <p className={muted}>
            Edit guide steps in English, Sinhala and Tamil, choose recommended products, and add new guides.
          </p>
        </Link>
        <Link href="/admin/orders" className={`${card} block transition hover:ring-emerald-300`}>
          <h2 className={subheading}>Orders</h2>
          <p className={muted}>
            Every signed-in customer&apos;s orders. Find one by its ASW- reference, phone or name.
          </p>
        </Link>
        {hasRole(user.role, "super_admin") && (
          <Link href="/admin/users" className={`${card} block transition hover:ring-emerald-300`}>
            <h2 className={subheading}>Users</h2>
            <p className={muted}>See everyone who has signed in and change their role.</p>
          </Link>
        )}
        {hasRole(user.role, "super_admin") && (
          <Link href="/admin/settings" className={`${card} block transition hover:ring-emerald-300`}>
            <h2 className={subheading}>Settings</h2>
            <p className={muted}>The bank details shown to customers who pay by bank transfer.</p>
          </Link>
        )}
      </div>
    </>
  );
}
