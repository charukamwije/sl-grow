"use client";

import { useState, useTransition } from "react";
import { changeRole } from "@/app/admin/users/actions";
import { ROLE_LABELS, ROLES, type Role } from "@/lib/supabase/roles";

type RoleSelectProps = {
  uid: string;
  role: Role;
  /** The signed-in super admin's own row */
  isSelf: boolean;
  label: string;
};

export default function RoleSelect({ uid, role, isSelf, label }: RoleSelectProps) {
  const [value, setValue] = useState<Role>(role);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onChange = (next: Role) => {
    if (next === value) return;

    const promoting = next === "super_admin";
    if (
      promoting &&
      !window.confirm(
        `Make ${label} a super admin? They will be able to change everyone's role, including yours.`
      )
    ) {
      return;
    }

    const previous = value;
    setValue(next);
    setError(null);

    startTransition(async () => {
      const result = await changeRole(uid, next);
      if (!result.ok) {
        setValue(previous);
        setError(result.error);
      }
    });
  };

  return (
    <div>
      <select
        aria-label={`Role for ${label}`}
        value={value}
        disabled={isPending || isSelf}
        onChange={(event) => onChange(event.target.value as Role)}
        className="rounded-xl bg-gray-50 px-3 py-2 text-sm ring-1 ring-inset ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
      >
        {ROLES.map((option) => (
          <option key={option} value={option}>
            {ROLE_LABELS[option]}
          </option>
        ))}
      </select>
      {isSelf && <p className="mt-1 text-xs text-gray-500">This is you</p>}
      {error && (
        <p role="alert" className="mt-1 max-w-xs text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
