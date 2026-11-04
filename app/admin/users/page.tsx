import type { Metadata } from "next";
import Link from "next/link";
import RoleSelect from "@/components/admin/RoleSelect";
import { btnSecondary, card, heading, muted } from "@/components/ui/styles";
import { requireRole } from "@/lib/supabase/admin-auth";
import { listUsers } from "@/lib/supabase/users";

export const metadata: Metadata = { title: "Users" };

// ISO timestamps are UTC; slicing keeps server and client output identical
function formatDate(value: string | null): string {
  return value ? `${value.slice(0, 16).replace("T", " ")} UTC` : "Never";
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const me = await requireRole("super_admin");

  const params = await searchParams;
  const requested = Number(params.page);
  const page = Number.isInteger(requested) && requested > 0 ? requested : 1;

  const { users, hasMore } = await listUsers(page);

  return (
    <>
      <h1 className={heading}>Users</h1>
      <p className={muted}>
        Everyone who has signed in. New sign-ins are members. Admins manage
        products, guides and orders; super admins also manage roles.
      </p>

      <div className={`${card} overflow-x-auto p-0 sm:p-0`}>
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="border-b border-black/5 text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Joined</th>
              <th className="px-4 py-3 font-semibold">Last sign-in</th>
              <th className="px-4 py-3 font-semibold">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {users.map((user) => {
              const label = user.displayName || user.email || user.uid;
              return (
                <tr key={user.uid}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{label}</p>
                    {user.displayName && user.email && (
                      <p className="text-xs text-gray-500">{user.email}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(user.lastSignInAt)}</td>
                  <td className="px-4 py-3">
                    <RoleSelect
                      uid={user.uid}
                      role={user.role}
                      isSelf={user.uid === me.uid}
                      label={label}
                    />
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  No users on this page.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between">
        {page > 1 ? (
          <Link href={`/admin/users?page=${page - 1}`} className={btnSecondary}>
            Previous
          </Link>
        ) : (
          <span />
        )}
        {hasMore && (
          <Link href={`/admin/users?page=${page + 1}`} className={btnSecondary}>
            Next
          </Link>
        )}
      </div>
    </>
  );
}
