"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { CheckCircleIcon } from "@heroicons/react/20/solid";
import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { uploadReceipt, type ReceiptResult } from "@/app/account/orders/actions";
import { useLanguage } from "@/contexts/language-context";
import type { BankDetails } from "@/lib/shop-settings";
import { acceptsReceipt, ORDER_PROGRESS } from "@/lib/order/checkout";
import { formatLKR } from "@/lib/products";
import type { OwnOrder } from "@/lib/supabase/account";
import { btnGhost, btnSmall, card, heading, muted, subheading } from "../ui/styles";
import { PaidBadge, StatusBadge, statusKey } from "./OrderBadges";

type OrderViewProps = {
  order: OwnOrder;
  /** Null when the shop has not set them yet */
  bank: BankDetails | null;
  /** Just placed: thank the customer */
  placed: boolean;
};

// ISO timestamps are UTC; slicing keeps server and client output identical
function formatDate(value: string): string {
  return `${value.slice(0, 16).replace("T", " ")} UTC`;
}

function Timeline({ order }: { order: OwnOrder }) {
  const { t } = useLanguage();
  const reached = ORDER_PROGRESS.indexOf(order.status);

  return (
    <ol className="space-y-3">
      {ORDER_PROGRESS.map((step, index) => {
        const done = index <= reached;
        return (
          <li key={step} className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                done ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-400"
              }`}
            >
              {done ? "✓" : index + 1}
            </span>
            <span className={done ? "font-medium text-gray-900" : "text-gray-500"}>
              {t(statusKey(step, order.method))}
              <span className="sr-only">{done ? " ✓" : ""}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function ReceiptUpload({ order }: { order: OwnOrder }) {
  const { t } = useLanguage();
  const [state, formAction, uploading] = useActionState<ReceiptResult | null, FormData>(
    uploadReceipt.bind(null, order.id),
    null
  );
  const hasReceipt = Boolean(order.receiptUploadedAt) || state?.ok;

  return (
    <div className="space-y-3 border-t border-black/5 pt-4">
      <h3 className="text-sm font-semibold text-gray-900">{t("receipt.title")}</h3>
      {hasReceipt && (
        <p role="status" className="flex items-start gap-2 text-sm text-emerald-800">
          <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
          {t("receipt.received")}
        </p>
      )}
      {acceptsReceipt(order) && (
        <form action={formAction} className="space-y-2">
          <p className="text-xs text-gray-500">{t("receipt.hint")}</p>
          <input
            type="file"
            name="receipt"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            required
            aria-label={t("receipt.title")}
            className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-full file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100"
          />
          <button type="submit" className={btnSmall} disabled={uploading}>
            {uploading
              ? t("receipt.uploading")
              : hasReceipt
                ? t("receipt.replace")
                : t("receipt.upload")}
          </button>
          {state && !state.ok && (
            <p role="alert" className="text-sm text-red-700">
              {t(state.error)}
            </p>
          )}
        </form>
      )}
    </div>
  );
}

function BankTransfer({ order, bank }: { order: OwnOrder; bank: BankDetails | null }) {
  const { t } = useLanguage();
  const rows: [string, string][] = bank
    ? [
        [t("bank.name"), bank.bankName],
        [t("bank.branch"), bank.branch],
        [t("bank.accountName"), bank.accountName],
        [t("bank.accountNumber"), bank.accountNumber],
      ].filter(([, value]) => value) as [string, string][]
    : [];

  return (
    <section className={`${card} space-y-4`}>
      <h2 className={`${subheading} !mb-0`}>{t("bank.title")}</h2>
      {!order.paid && order.status !== "cancelled" && (
        bank ? (
          <>
            <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-[9rem_1fr]">
              {rows.map(([term, value]) => (
                <div key={term} className="contents">
                  <dt className="text-gray-500">{term}</dt>
                  <dd className="font-medium text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">
              {t("bank.useRef", { ref: order.ref ?? "" })}
            </p>
            {bank.note && <p className="text-sm text-gray-600">{bank.note}</p>}
          </>
        ) : (
          <p className={muted}>{t("bank.missing")}</p>
        )
      )}
      <ReceiptUpload order={order} />
    </section>
  );
}

export default function OrderView({ order, bank, placed }: OrderViewProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const copyRef = async () => {
    if (!order.ref) return;
    try {
      await navigator.clipboard.writeText(order.ref);
      setCopied(true);
    } catch {
      // Clipboard blocked: the reference is on screen to copy by hand
    }
  };

  const paymentLabel =
    order.payment === "bank_transfer"
      ? t("pay.bank")
      : order.method === "pickup"
        ? t("pay.atPickup")
        : t("pay.cod");

  return (
    <div className="space-y-4 pb-8">
      <Link href="/account" className={btnGhost}>
        ← {t("orderPage.back")}
      </Link>

      {placed && (
        <p role="status" className="flex items-start gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-medium text-emerald-900 ring-1 ring-emerald-200">
          <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
          {t("orderPage.placed")}
        </p>
      )}

      <section className={`${card} space-y-2`}>
        <p className="text-xs font-medium text-gray-500">{t("order.refLabel")}</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className={`${heading} font-mono tracking-wider`}>{order.ref}</h1>
          <button
            type="button"
            onClick={copyRef}
            className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-50"
          >
            <ClipboardDocumentIcon className="h-4 w-4" aria-hidden="true" />
            {copied ? t("copied") : t("copy")}
          </button>
        </div>
        <p className={muted}>
          <time dateTime={order.createdAt}>{formatDate(order.createdAt)}</time>
        </p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          <StatusBadge status={order.status} method={order.method} />
          {order.status !== "cancelled" && <PaidBadge paid={order.paid} />}
        </div>
      </section>

      <section className={card}>
        <h2 className={subheading}>{t("orderPage.status")}</h2>
        {order.status === "cancelled" ? (
          <p className="text-sm text-gray-700">{t("orderPage.cancelledText")}</p>
        ) : (
          <Timeline order={order} />
        )}
      </section>

      <section className={`${card} space-y-1 text-sm`}>
        <h2 className={subheading}>{t("orderPage.payment")}</h2>
        <p className="text-gray-900">
          {paymentLabel} · {order.method === "delivery" ? t("checkout.delivery") : t("checkout.pickup")}
        </p>
        {order.method === "delivery" && order.address && (
          <p className="whitespace-pre-wrap text-gray-600">{order.address}</p>
        )}
      </section>

      {order.payment === "bank_transfer" && <BankTransfer order={order} bank={bank} />}

      <section className={`${card} overflow-x-auto`}>
        <h2 className={subheading}>{t("orderPage.items")}</h2>
        <ul className="divide-y divide-black/5 text-sm">
          {order.items.map((item) => (
            <li key={item.code} className="flex justify-between gap-3 py-2">
              <span>
                <code className="text-xs text-gray-500">{item.code}</code> {item.name} × {item.qty}
              </span>
              <span className="tabular-nums">{formatLKR(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex justify-between border-t border-black/10 pt-3 font-semibold">
          <span>{t("cart.total")}</span>
          <span className="tabular-nums">{formatLKR(order.total)}</span>
        </p>
      </section>
    </div>
  );
}
