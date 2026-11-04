// Fails the build if this module is ever pulled into a client bundle
import "server-only";
import {
  OPEN_STATUSES,
  certificateState,
  type ApplicationInput,
  type CertificateState,
  type CertStatus,
  type TrackId,
} from "./certification/status";
import type { ApplicationFilters } from "./certification/filters";
import { generateApplicationRef, generateCertificateCode } from "./order/reference";
import { adminDb } from "./supabase/admin";
import { DatabaseError } from "./supabase/store";

/** An application as its applicant sees it */
export type OwnApplication = {
  id: string;
  ref: string;
  track: TrackId;
  createdAt: string;
  status: CertStatus;
  adminNote: string;
  certificateCode: string | null;
  expiresAt: string | null;
};

/** An application as admins see it */
export type AdminApplication = OwnApplication & {
  name: string;
  phone: string;
  location: string;
  notes: string;
  certifiedAt: string | null;
  statusUpdatedAt: string | null;
  accountEmail: string | null;
};

/** A certificate as anyone with its link sees it */
export type PublicCertificate = {
  code: string;
  name: string;
  track: TrackId;
  issuedAt: string;
  expiresAt: string | null;
  state: CertificateState;
  /** Only to decide whether to show the owner's share panel */
  ownerId: string;
};

type Row = {
  id: string;
  user_id: string;
  ref: string;
  track: TrackId;
  name: string;
  phone: string;
  location: string;
  notes: string;
  status: CertStatus;
  admin_note: string;
  certificate_code: string | null;
  certified_at: string | null;
  expires_at: string | null;
  status_updated_at: string | null;
  created_at: string;
};

const COLUMNS =
  "id, user_id, ref, track, name, phone, location, notes, status, admin_note, certificate_code, certified_at, expires_at, status_updated_at, created_at";

const iso = (value: string | null) => (value ? new Date(value).toISOString() : null);

function toOwn(row: Row): OwnApplication {
  return {
    id: row.id,
    ref: row.ref,
    track: row.track,
    createdAt: new Date(row.created_at).toISOString(),
    status: row.status,
    adminNote: row.admin_note,
    certificateCode: row.certificate_code,
    expiresAt: iso(row.expires_at),
  };
}

function fail(error: { message: string; code?: string }, status: number): never {
  throw new DatabaseError(error.message, error.code ?? "", status);
}

/** Thrown when the applicant already has an open application for the path */
export class OpenApplicationError extends Error {}

/** Thrown when the applicant already holds a valid certificate for the path */
export class AlreadyCertifiedError extends Error {}

// Six characters from 29 make a clash rare; a few tries is plenty
const CODE_ATTEMPTS = 3;

export async function createApplication(
  uid: string,
  input: ApplicationInput,
  makeRef: () => string = generateApplicationRef
): Promise<{ id: string; ref: string }> {
  const existing = await adminDb
    .from("certification_applications")
    .select("status, expires_at")
    .eq("user_id", uid)
    .eq("track", input.track)
    .overrideTypes<{ status: CertStatus; expires_at: string | null }[], { merge: false }>();

  if (existing.error) fail(existing.error, existing.status);

  for (const row of existing.data) {
    if (OPEN_STATUSES.includes(row.status)) throw new OpenApplicationError();
    if (certificateState({ status: row.status, expiresAt: row.expires_at }) === "valid") {
      throw new AlreadyCertifiedError();
    }
  }

  for (let attempt = 1; ; attempt++) {
    const ref = makeRef();
    const { data, error, status } = await adminDb
      .from("certification_applications")
      .insert({ user_id: uid, ref, ...input })
      .select("id")
      .single<{ id: string }>();

    if (error?.code === "23505") {
      // The partial unique index: an application opened in the meantime
      if (error.message.includes("one_open")) throw new OpenApplicationError();
      if (attempt < CODE_ATTEMPTS) continue;
    }
    if (error) fail(error, status);

    return { id: data!.id, ref };
  }
}

export async function listOwnApplications(uid: string): Promise<OwnApplication[]> {
  const { data, error, status } = await adminDb
    .from("certification_applications")
    .select(COLUMNS)
    .eq("user_id", uid)
    .order("created_at", { ascending: false })
    .overrideTypes<Row[], { merge: false }>();

  if (error) fail(error, status);
  return data.map(toOwn);
}


export const APPLICATIONS_PER_PAGE = 50;

async function emailsFor(userIds: string[]): Promise<Map<string, string>> {
  const emails = new Map<string, string>();
  const ids = [...new Set(userIds)];
  if (ids.length === 0) return emails;

  const { data, error, status } = await adminDb
    .from("profiles")
    .select("user_id, email")
    .in("user_id", ids)
    .overrideTypes<{ user_id: string; email: string | null }[], { merge: false }>();

  if (error) fail(error, status);
  for (const row of data) if (row.email) emails.set(row.user_id, row.email);
  return emails;
}

function toAdmin(row: Row, emails: Map<string, string>): AdminApplication {
  return {
    ...toOwn(row),
    name: row.name,
    phone: row.phone,
    location: row.location,
    notes: row.notes,
    certifiedAt: iso(row.certified_at),
    statusUpdatedAt: iso(row.status_updated_at),
    accountEmail: emails.get(row.user_id) ?? null,
  };
}

export async function listAdminApplications(
  filters: ApplicationFilters
): Promise<{ applications: AdminApplication[]; total: number }> {
  const start = (filters.page - 1) * APPLICATIONS_PER_PAGE;

  let query = adminDb
    .from("certification_applications")
    .select(COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(start, start + APPLICATIONS_PER_PAGE - 1);

  if (filters.q) {
    // The search text was reduced to characters with no meaning to PostgREST
    const pattern = `*${filters.q}*`;
    query = query.or(`ref.ilike.${pattern},phone.ilike.${pattern},name.ilike.${pattern}`);
  }
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.track) query = query.eq("track", filters.track);

  const { data, error, status, count } = await query.overrideTypes<Row[], { merge: false }>();
  if (error) fail(error, status);

  const emails = await emailsFor(data.map((row) => row.user_id));
  return { applications: data.map((row) => toAdmin(row, emails)), total: count ?? 0 };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getAdminApplication(id: string): Promise<AdminApplication | null> {
  if (!UUID.test(id)) return null;

  const { data, error, status } = await adminDb
    .from("certification_applications")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle<Row>();

  if (error) fail(error, status);
  if (!data) return null;

  return toAdmin(data, await emailsFor([data.user_id]));
}

export type StatusChange = {
  status: CertStatus;
  note: string;
  /** ISO timestamp; required when certifying */
  expiresAt: string | null;
};

/**
 * Applies an admin's decision. Certifying for the first time issues a
 * certificate code; certifying again keeps it and moves the expiry. Moving
 * away from certified keeps the code, so its link reports "no longer valid".
 * Returns false when there is no such application.
 */
export async function updateApplicationStatus(
  id: string,
  change: StatusChange,
  actorId: string,
  makeCode: () => string = generateCertificateCode
): Promise<boolean> {
  const current = await adminDb
    .from("certification_applications")
    .select("certificate_code, certified_at")
    .eq("id", id)
    .maybeSingle<{ certificate_code: string | null; certified_at: string | null }>();

  if (current.error) fail(current.error, current.status);
  if (!current.data) return false;

  const now = new Date().toISOString();
  const base = {
    status: change.status,
    admin_note: change.note,
    status_updated_at: now,
    updated_by: actorId,
  };

  for (let attempt = 1; ; attempt++) {
    const update =
      change.status === "certified"
        ? {
            ...base,
            certificate_code: current.data.certificate_code ?? makeCode(),
            certified_at: current.data.certified_at ?? now,
            expires_at: change.expiresAt,
          }
        : base;

    const { data, error, status } = await adminDb
      .from("certification_applications")
      .update(update)
      .eq("id", id)
      .select("id");

    // A freshly made certificate code that is already taken: make another
    if (
      error?.code === "23505" &&
      !current.data.certificate_code &&
      attempt < CODE_ATTEMPTS
    ) {
      continue;
    }
    if (error) fail(error, status);

    return (data ?? []).length > 0;
  }
}

/** The public view of a certificate, or null when the code is unknown */
export async function getCertificate(code: string): Promise<PublicCertificate | null> {
  const { data, error, status } = await adminDb
    .from("certification_applications")
    .select("user_id, name, track, status, certificate_code, certified_at, expires_at")
    .eq("certificate_code", code)
    .maybeSingle<
      Pick<Row, "user_id" | "name" | "track" | "status" | "certificate_code" | "certified_at" | "expires_at">
    >();

  if (error) fail(error, status);
  if (!data || !data.certificate_code || !data.certified_at) return null;

  return {
    code: data.certificate_code,
    name: data.name,
    track: data.track,
    issuedAt: new Date(data.certified_at).toISOString(),
    expiresAt: iso(data.expires_at),
    state: certificateState({ status: data.status, expiresAt: data.expires_at }),
    ownerId: data.user_id,
  };
}

/** For the admin dashboard: applications nobody has picked up yet */
export async function countNewApplications(): Promise<number> {
  const { count, error, status } = await adminDb
    .from("certification_applications")
    .select("id", { count: "exact", head: true })
    .eq("status", "applied");

  if (error) fail(error, status);
  return count ?? 0;
}
