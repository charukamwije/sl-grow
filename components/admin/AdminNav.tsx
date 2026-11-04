"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AcademicCapIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  CubeIcon,
  HomeIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType, SVGProps } from "react";
import { hasRole, ROLE_LABELS, type Role } from "@/lib/supabase/roles";

type Item = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  min: Role;
};

// Showing an entry is a convenience; each page checks the role itself
const ITEMS: Item[] = [
  { href: "/admin", label: "Dashboard", icon: HomeIcon, min: "admin" },
  { href: "/admin/products", label: "Products", icon: CubeIcon, min: "admin" },
  { href: "/admin/guides", label: "Guides", icon: BookOpenIcon, min: "admin" },
  { href: "/admin/orders", label: "Orders", icon: ClipboardDocumentListIcon, min: "admin" },
  { href: "/admin/certifications", label: "Certifications", icon: AcademicCapIcon, min: "admin" },
  { href: "/admin/users", label: "Users", icon: UsersIcon, min: "super_admin" },
  { href: "/admin/settings", label: "Settings", icon: Cog6ToothIcon, min: "super_admin" },
];

export default function AdminNav({ role }: { role: Role }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === href : pathname.startsWith(href);

  return (
    <nav aria-label="Admin" className="rounded-3xl bg-white p-3 shadow-sm ring-1 ring-black/5">
      <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
        Admin · {ROLE_LABELS[role]}
      </p>
      <ul className="flex gap-1 overflow-x-auto md:flex-col">
        {ITEMS.filter((item) => hasRole(role, item.min)).map(
          ({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            );
          }
        )}
      </ul>
    </nav>
  );
}
