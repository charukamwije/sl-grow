import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CertificationStatusControls from "@/components/admin/CertificationStatusControls";
import LocalTime from "@/components/ui/LocalTime";
import { btnGhost, card, heading, muted, subheading } from "@/components/ui/styles";
import { certificateState, CERT_STATUS_LABELS } from "@/lib/certification/status";
import { getAdminApplication } from "@/lib/certifications-server";
import { getTrack } from "@/lib/data/certifications";
import { requireRole } from "@/lib/supabase/admin-auth";

export const metadata: Metadata = { title: "Application" };

export default async function AdminCertificationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");

  const application = await getAdminApplication((await params).id);
  if (!application) notFound();

  const track = getTrack(application.track);
  const details: [string, string][] = [
    ["Path", track?.name.en ?? application.track],
    ["Name", application.name],
    ["Phone", application.phone],
    ["District or town", application.location],
    ["About them", application.notes || "Nothing added"],
    ["Account", application.accountEmail ?? "Account deleted"],
  ];

  const state = application.certificateCode ? certificateState(application) : null;

  return (
    <>
      <Link href="/admin/certifications" className={btnGhost}>
        ← Certifications
      </Link>
      <div>
        <h1 className={`${heading} font-mono`}>{application.ref}</h1>
        <p className={muted}>
          Applied <LocalTime value={application.createdAt} /> ·{" "}
          {CERT_STATUS_LABELS[application.status]}
          {application.statusUpdatedAt && (
            <>
              , changed <LocalTime value={application.statusUpdatedAt} />
            </>
          )}
        </p>
      </div>

      <section className={`${card} space-y-3`}>
        <h2 className={`${subheading} !mb-0`}>Decision</h2>
        <CertificationStatusControls
          id={application.id}
          status={application.status}
          note={application.adminNote}
          expiresAt={application.expiresAt}
        />
      </section>

      {application.certificateCode && (
        <section className={`${card} space-y-2 text-sm`}>
          <h2 className={`${subheading} !mb-0`}>Certificate</h2>
          <p>
            <Link
              href={`/verify/${application.certificateCode}`}
              className="font-mono font-semibold text-emerald-700 hover:underline"
            >
              {application.certificateCode}
            </Link>{" "}
            ·{" "}
            {state === "valid"
              ? "Valid"
              : state === "expired"
                ? "Expired"
                : "No longer valid (status is not Certified)"}
          </p>
          <p className={muted}>
            {application.certifiedAt && (
              <>
                Issued <LocalTime value={application.certifiedAt} />
              </>
            )}
            {application.expiresAt ? ` · Valid until ${application.expiresAt.slice(0, 10)}` : ""}
          </p>
        </section>
      )}

      <section className={card}>
        <h2 className={subheading}>Applicant</h2>
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[10rem_1fr]">
          {details.map(([term, value]) => (
            <div key={term} className="contents">
              <dt className="text-gray-500">{term}</dt>
              <dd className="whitespace-pre-wrap text-gray-900">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4">
          <a
            href={`tel:${application.phone.replace(/[^\d+]/g, "")}`}
            className="text-sm font-medium text-emerald-700 hover:underline"
          >
            Call {application.phone}
          </a>
        </p>
      </section>
    </>
  );
}
