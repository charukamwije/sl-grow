"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setApplicationStatus } from "@/app/admin/certifications/actions";
import Loading from "@/components/icons/Loading";
import { btnPrimary, input, label } from "@/components/ui/styles";
import {
  CERT_STATUSES,
  CERT_STATUS_LABELS,
  defaultExpiry,
  type CertStatus,
} from "@/lib/certification/status";

type Props = {
  id: string;
  status: CertStatus;
  note: string;
  /** Current expiry as an ISO timestamp, if certified before */
  expiresAt: string | null;
};

// Decisions the applicant sees as final are worth a second look
const CONFIRM: Partial<Record<CertStatus, string>> = {
  certified: "Certify this applicant? They get a public certificate link to share.",
  rejected: "Reject this application? The applicant sees it as rejected.",
};

export default function CertificationStatusControls({ id, status, note, expiresAt }: Props) {
  const router = useRouter();
  const [nextStatus, setNextStatus] = useState<CertStatus>(status);
  const [nextNote, setNextNote] = useState(note);
  const [expiry, setExpiry] = useState(expiresAt ? expiresAt.slice(0, 10) : defaultExpiry());
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const save = () => {
    const question = nextStatus !== status ? CONFIRM[nextStatus] : undefined;
    if (question && !window.confirm(question)) return;

    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await setApplicationStatus(id, nextStatus, nextNote, expiry);
      if (result.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cert-status" className={label}>
            Status
          </label>
          <select
            id="cert-status"
            className={input}
            value={nextStatus}
            onChange={(event) => setNextStatus(event.target.value as CertStatus)}
          >
            {CERT_STATUSES.map((option) => (
              <option key={option} value={option}>
                {CERT_STATUS_LABELS[option]}
              </option>
            ))}
          </select>
        </div>
        {nextStatus === "certified" && (
          <div>
            <label htmlFor="cert-expiry" className={label}>
              Valid until
            </label>
            <input
              id="cert-expiry"
              type="date"
              className={input}
              value={expiry}
              onChange={(event) => setExpiry(event.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500">2 years from today unless you change it.</p>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="cert-note" className={label}>
          Note to the applicant (optional)
        </label>
        <textarea
          id="cert-note"
          className={`${input} min-h-24`}
          value={nextNote}
          maxLength={1000}
          placeholder="e.g. Please send a photo of your seedlings so we can finish the review."
          onChange={(event) => setNextNote(event.target.value)}
        />
        <p className="mt-1 text-xs text-gray-500">
          Shown to the applicant on the Join and Account pages.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={btnPrimary} onClick={save} disabled={pending}>
          {pending && <Loading size="small" color="white" />}
          Save
        </button>
        {saved && (
          <p role="status" className="text-sm text-emerald-700">
            Saved. The applicant sees it now.
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
