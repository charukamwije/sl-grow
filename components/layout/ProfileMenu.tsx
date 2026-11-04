"use client";

import Link from "next/link";
import { Menu, MenuButton, MenuItem, MenuItems, MenuSeparator } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import {
  ArrowRightEndOnRectangleIcon,
  ArrowRightStartOnRectangleIcon,
  Cog6ToothIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { useSession } from "@/contexts/session-context";
import { hasRole } from "@/lib/supabase/roles";

const item =
  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-gray-700 data-[focus]:bg-gray-50 data-[focus]:text-gray-900";

/**
 * The bar's one account control: the signed-in user's name, opening their
 * account, the admin panel for admins, and sign-out. Signed out, it offers
 * sign-in and the Account page, where guests' orders and plans are kept.
 */
export default function ProfileMenu({ onSignIn }: { onSignIn: () => void }) {
  const { user, accountsEnabled } = useSession();
  const { t } = useLanguage();
  const { signOut, isAuthLoading } = useAuth();

  const firstName = user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "";
  const isAdmin = hasRole(user?.role, "admin");

  return (
    <Menu>
      <MenuButton
        className={`flex max-w-[11rem] items-center gap-1.5 rounded-full py-1.5 pl-2 pr-2.5 text-sm font-medium transition focus:outline-none data-[focus]:ring-2 data-[focus]:ring-emerald-500 ${
          user
            ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            : "text-gray-700 hover:bg-gray-100"
        }`}
      >
        <UserCircleIcon className="h-6 w-6 shrink-0" aria-hidden="true" />
        <span className="truncate">
          {user ? firstName : accountsEnabled ? t("signIn") : t("nav.account")}
        </span>
        <ChevronDownIcon className="h-4 w-4 shrink-0 opacity-60" aria-hidden="true" />
      </MenuButton>

      <MenuItems
        anchor="bottom end"
        transition
        className="z-40 mt-2 w-64 origin-top-right rounded-2xl bg-white p-1.5 shadow-lg ring-1 ring-black/5 transition duration-100 ease-out focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0"
      >
        {user && (
          <>
            <div className="px-3 pb-2 pt-1.5">
              <p className="truncate text-sm font-semibold text-gray-900">
                {user.displayName || user.email}
              </p>
              {user.displayName && user.email && (
                <p className="truncate text-xs text-gray-500">{user.email}</p>
              )}
            </div>
            <MenuSeparator className="my-1 h-px bg-black/5" />
          </>
        )}

        <MenuItem>
          <Link href="/account" className={item}>
            <UserCircleIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            {t("nav.account")}
          </Link>
        </MenuItem>

        {isAdmin && (
          <MenuItem>
            <Link href="/admin" className={item}>
              <Cog6ToothIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              Admin panel
            </Link>
          </MenuItem>
        )}

        {accountsEnabled && (
          <>
            <MenuSeparator className="my-1 h-px bg-black/5" />
            {user ? (
              <MenuItem disabled={isAuthLoading}>
                <button type="button" onClick={() => void signOut()} className={`${item} data-[disabled]:opacity-50`}>
                  <ArrowRightStartOnRectangleIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  {t("signOut")}
                </button>
              </MenuItem>
            ) : (
              <MenuItem disabled={isAuthLoading}>
                <button type="button" onClick={onSignIn} className={`${item} data-[disabled]:opacity-50`}>
                  <ArrowRightEndOnRectangleIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  {t("signIn")}
                </button>
              </MenuItem>
            )}
          </>
        )}
      </MenuItems>
    </Menu>
  );
}
