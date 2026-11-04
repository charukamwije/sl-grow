"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { certificateState, type CertStatus } from "@/lib/certification/status";
import { getTrack } from "@/lib/data/certifications";
import type { StringKey } from "@/lib/i18n/strings";
import type { OwnApplication } from "@/lib/certifications-server";

const TINT: Record<CertStatus, string> = {
  applied: "bg-sky-50 text-sky-800",
  in_review: "bg-indigo-50 text-indigo-800",
  on_hold: "bg-amber-50 text-amber-800",
  rejected: "bg-gray-100 text-gray-600",
  certified: "bg-emerald-600 text-white",
};

export function CertStatusBadge({ status }: { status: CertStatus }) {
  const { t } = useLanguage();
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TINT[status]}`}>
      {t(`certStatus.${status}` as StringKey)}
    </span>
  );
}

const day = (iso: string) => iso.slice(0, 10);

/** One application: reference, path, status, the team's note, the certificate */
export function ApplicationItem({ application }: { application: OwnApplication }) {
  const { t, l } = useLanguage();
  const track = getTrack(application.track);
  const state =
    application.status === "certified" ? certificateState(application) : null;

  return (
    <li className="space-y-2 rounded-2xl border border-black/5 p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-mono text-xs font-bold tracking-wider text-emerald-800">
            {application.ref}
          </span>
          <CertStatusBadge status={application.status} />
        </span>
        <time dateTime={application.createdAt} className="text-xs text-gray-500">
          {day(application.createdAt)}
        </time>
      </div>
      <p className="text-gray-800">{track ? l(track.name) : application.track}</p>
      {application.adminNote && (
        <p className="rounded-xl bg-gray-50 p-2.5 text-gray-700">
          <span className="block text-xs font-medium text-gray-500">{t("cert.noteLabel")}</span>
          <span className="whitespace-pre-wrap">{application.adminNote}</span>
        </p>
      )}
      {application.status === "certified" && application.certificateCode && application.expiresAt && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link
            href={`/verify/${application.certificateCode}`}
            className="font-semibold text-emerald-700 hover:underline"
          >
            🏅 {t("cert.view")} →
          </Link>
          <span className={state === "expired" ? "text-red-700" : "text-gray-500"}>
            {state === "expired"
              ? t("cert.expiredShort", { date: day(application.expiresAt) })
              : t("cert.validUntil", { date: day(application.expiresAt) })}
          </span>
        </p>
      )}
    </li>
  );
}

export default function ApplicationList({ applications }: { applications: OwnApplication[] }) {
  return (
    <ul className="space-y-2">
      {applications.map((application) => (
        <ApplicationItem key={application.id} application={application} />
      ))}
    </ul>
  );
}
