"use client";

import { TrashIcon } from "@heroicons/react/24/outline";
import Loading from "../icons/Loading";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";

type AccountDeleteButtonProps = {
  /** The user just re-authenticated for this, so one more click deletes */
  confirmDelete?: boolean;
};

export default function AccountDeleteButton({
  confirmDelete = false,
}: AccountDeleteButtonProps) {
  const { loadingProvider, isAuthLoading, deleteAccount } = useAuth();
  const { t } = useLanguage();

  const handleDeleteAccount = async () => {
    // Deleting is irreversible and nothing on the server can undo it. When the
    // server still wants a fresh sign-in, `deleteAccount` sends the user to
    // Google and they come back here with `confirmDelete` set.
    if (
      !window.confirm(t("account.deleteConfirm"))
    ) {
      return;
    }

    await deleteAccount();
  };

  const isDeleting = loadingProvider === "delete";

  return (
    <button
      className="rounded-lg bg-red-50 text-red-700 hover:bg-red-100 px-4 py-2 text-sm font-medium transition-all duration-300 flex items-center gap-2 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-red-300/50 disabled:opacity-70"
      onClick={handleDeleteAccount}
      disabled={isAuthLoading}
    >
      {isDeleting ? (
        <Loading size="small" color="red" />
      ) : (
        <TrashIcon className="h-4.5 w-4.5" aria-hidden="true" />
      )}
      <span>{t(confirmDelete ? "account.deleteFinish" : "account.delete")}</span>
    </button>
  );
}
