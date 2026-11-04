import type { Metadata } from "next";
import Link from "next/link";
import { btnPrimary, btnSecondary, card, heading, input, label, muted } from "@/components/ui/styles";
import {
  applicationFiltersQuery,
  parseApplicationFilters,
} from "@/lib/certification/filters";
import { CERT_STATUSES, CERT_STATUS_LABELS, type CertStatus } from "@/lib/certification/status";
import { APPLICATIONS_PER_PAGE, listAdminApplications } from "@/lib/certifications-server";
import { CERT_TRACKS, getTrack } from "@/lib/data/certifications";
import { requireRole } from "@/lib/supabase/admin-auth";

export const metadata: Metadata = { title: "Certifications" };

const TINT: Record<CertStatus, string> = {
  applied: "bg-sky-50 text-sky-800",
  in_review: "bg-indigo-50 text-indigo-800",
  on_hold: "bg-amber-50 text-amber-800",
  rejected: "bg-gray-100 text-gray-600",
  certified: "bg-emerald-50 text-emerald-800",
};

export default async function AdminCertificationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole("admin");

  const filters = parseApplicationFilters(await searchParams);
  const { applications, total } = await listAdminApplications(filters);
  const pages = Math.max(1, Math.ceil(total / APPLICATIONS_PER_PAGE));
  const filtered = Boolean(filters.q || filters.status || filters.track);

  return (
    <>
      <div>
        <h1 className={heading}>Certifications</h1>
        <p className={muted}>
          Applications for Aswedduma Certified, newest first. Open one to review it, leave a note
          for the applicant, and certify it.
        </p>
      </div>

      <form
        className={`${card} grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto] lg:items-end`}
        role="search"
      >
        <div>
          <label htmlFor="q" className={label}>
            Reference, phone or name
          </label>
          <input
            id="q"
            type="search"
            name="q"
            defaultValue={filters.q}
            placeholder="e.g. APP-7K3P9Q"
            className={input}
          />
        </div>
        <div>
          <label htmlFor="status" className={label}>
            Status
          </label>
          <select id="status" name="status" defaultValue={filters.status ?? ""} className={input}>
            <option value="">Any status</option>
            {CERT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {CERT_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="track" className={label}>
            Path
          </label>
          <select id="track" name="track" defaultValue={filters.track ?? ""} className={input}>
            <option value="">Any path</option>
            {CERT_TRACKS.map((track) => (
              <option key={track.id} value={track.id}>
                {track.badgeLabel}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className={btnPrimary}>
            Search
          </button>
          {filtered && (
            <Link href="/admin/certifications" className={btnSecondary}>
              Clear
            </Link>
          )}
        </div>
      </form>

      <p className={muted}>
        {total === 0
          ? filtered
            ? "No applications match."
            : "No applications yet."
          : `${total} application${total === 1 ? "" : "s"}${filtered ? " match" : ""}.`}
      </p>

      {applications.length > 0 && (
        <div className={`${card} overflow-x-auto p-0 sm:p-0`}>
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-black/5 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Reference</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Applicant</th>
                <th className="px-4 py-3 font-semibold">Path</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {applications.map((application) => (
                <tr key={application.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/certifications/${application.id}`}
                      className="font-mono text-xs font-bold tracking-wider text-emerald-800 hover:underline"
                    >
                      {application.ref}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{application.createdAt.slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{application.name}</p>
                    <p className="text-xs text-gray-500">
                      {application.phone} · {application.location}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {getTrack(application.track)?.badgeLabel ?? application.track}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TINT[application.status]}`}
                    >
                      {CERT_STATUS_LABELS[application.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between">
          {filters.page > 1 ? (
            <Link
              href={`/admin/certifications${applicationFiltersQuery(filters, filters.page - 1)}`}
              className={btnSecondary}
            >
              Previous
            </Link>
          ) : (
            <span />
          )}
          <span className={muted}>
            Page {filters.page} of {pages}
          </span>
          {filters.page < pages ? (
            <Link
              href={`/admin/certifications${applicationFiltersQuery(filters, filters.page + 1)}`}
              className={btnSecondary}
            >
              Next
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </>
  );
}
