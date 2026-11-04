"use client";

import { useState } from "react";
import { CheckBadgeIcon, ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import { useLanguage } from "@/contexts/language-context";
import type { CertificateState } from "@/lib/certification/status";
import {
  linkedInAddToProfile,
  shareLinks,
  type ShareableCertificate,
} from "@/lib/certification/share";
import { getTrack, type CertTrack } from "@/lib/data/certifications";
import { btnPrimary, btnSecondary, card } from "../ui/styles";
import DigitalBadge from "./DigitalBadge";

type CertificateViewProps = {
  code: string;
  name: string;
  track: CertTrack["id"];
  issuedAt: string;
  expiresAt: string | null;
  state: CertificateState;
  /** Absolute URL of this page */
  url: string;
  /** The signed-in viewer holds this certificate: show the share panel */
  isOwner: boolean;
};

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

function SharePanel({ cert }: { cert: ShareableCertificate }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const links = shareLinks(cert);
  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cert.url);
      setCopied(true);
    } catch {
      // Clipboard blocked: the link is in the address bar
    }
  };

  const share = async () => {
    try {
      await navigator.share({ title: cert.trackName, url: cert.url });
    } catch {
      // Dismissed, or not allowed: the other buttons still work
    }
  };

  const social = [
    { href: links.linkedInPost, label: t("verify.postLinkedIn") },
    { href: links.facebook, label: "Facebook" },
    { href: links.x, label: "X" },
    { href: links.whatsapp, label: "WhatsApp" },
  ];

  return (
    <section className={`${card} space-y-4`}>
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{t("verify.shareTitle")}</h2>
        <p className="text-sm text-gray-500">{t("verify.shareHint")}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href={linkedInAddToProfile(cert)}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btnPrimary} !bg-[#0a66c2] hover:!bg-[#004182]`}
        >
          {t("verify.addLinkedIn")}
        </a>
        <a href={`/verify/${cert.code}/certificate.png?download=1`} download className={btnSecondary}>
          ⬇ {t("verify.download")}
        </a>
      </div>
      <div className="flex flex-wrap gap-2">
        {social.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={btnSecondary}
          >
            {link.label}
          </a>
        ))}
        <button type="button" onClick={copy} className={btnSecondary}>
          {copied ? t("verify.linkCopied") : t("verify.copyLink")}
        </button>
        {canShare && (
          <button type="button" onClick={share} className={btnSecondary}>
            {t("verify.share")}
          </button>
        )}
      </div>
    </section>
  );
}

/** The public certificate at /verify/<code>: what an employer checks */
export default function CertificateView(props: CertificateViewProps) {
  const { t } = useLanguage();
  const track = getTrack(props.track)!;

  const banner =
    props.state === "valid"
      ? { text: t("verify.valid"), className: "bg-emerald-50 text-emerald-900 ring-emerald-200", Icon: CheckBadgeIcon }
      : {
          text: props.state === "expired" ? t("verify.expired") : t("verify.revoked"),
          className: "bg-red-50 text-red-900 ring-red-200",
          Icon: ExclamationTriangleIcon,
        };

  const rows: [string, string][] = [
    [t("verify.issued"), formatDay(props.issuedAt)],
    ...(props.expiresAt ? [[t("verify.validUntil"), formatDay(props.expiresAt)] as [string, string]] : []),
    [t("verify.code"), props.code],
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-10">
      <p
        role="status"
        className={`flex items-center gap-2 rounded-2xl p-4 text-base font-semibold ring-1 ${banner.className}`}
      >
        <banner.Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
        {banner.text}
      </p>

      <article className={`${card} flex flex-col items-center gap-6 sm:flex-row sm:items-start`}>
        <DigitalBadge track={track} className="w-40 shrink-0" />
        <div className="min-w-0 flex-1 space-y-4 text-center sm:text-left">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
              Aswedduma Certified
            </p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">{track.name.en}</h1>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t("verify.awardedTo")}</p>
            <p className="text-3xl font-bold text-gray-900">{props.name}</p>
          </div>
          <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
            {rows.map(([term, value]) => (
              <div key={term} className="contents">
                <dt className="text-gray-500">{term}</dt>
                <dd className="font-medium text-gray-900">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </article>

      {props.isOwner && props.expiresAt && (
        <SharePanel
          cert={{
            trackName: track.name.en,
            code: props.code,
            url: props.url,
            issuedAt: props.issuedAt,
            expiresAt: props.expiresAt,
          }}
        />
      )}

      <p className="text-xs leading-relaxed text-gray-500">{t("verify.issuer")}</p>
    </div>
  );
}
