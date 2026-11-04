import type { Metadata } from "next";
import AdminNav from "@/components/admin/AdminNav";
import { requireRole } from "@/lib/supabase/admin-auth";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

/**
 * The admin console. Members and guests get a 404 here, but each page and
 * action below checks the role again for itself.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("admin");

  return (
    <div className="flex flex-col gap-6 pb-12 md:flex-row">
      <aside className="md:w-56 md:shrink-0">
        <AdminNav role={user.role} />
      </aside>
      <div className="min-w-0 flex-1 space-y-4">{children}</div>
    </div>
  );
}
