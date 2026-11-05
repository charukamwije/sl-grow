"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { useSession } from "@/contexts/session-context";
import AuthModal from "../../modals/AuthModal";
import { btnPrimary, card, muted } from "../../ui/styles";

/** Guests see this instead of their plantations: records are kept in an account */
export default function SignInToManage() {
  const { t } = useLanguage();
  const { accountsEnabled } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <section className={`${card} space-y-3 text-center`}>
      <p className="text-4xl" aria-hidden="true">
        🍃🪵
      </p>
      <h2 className="text-lg font-semibold text-gray-900">Manage your tea or cinnamon land</h2>
      <p className={`${muted} mx-auto max-w-lg`}>
        Record harvests, sales and costs, field work and workers&apos; wages, and see your
        profit and yield for each year. Your records are private to your account.
      </p>
      {accountsEnabled ? (
        <>
          <button type="button" className={btnPrimary} onClick={() => setOpen(true)}>
            {t("signInGoogle")}
          </button>
          <AuthModal isOpen={open} onClose={() => setOpen(false)} />
        </>
      ) : (
        <p className={muted}>{t("account.notConfigured")}</p>
      )}
    </section>
  );
}
