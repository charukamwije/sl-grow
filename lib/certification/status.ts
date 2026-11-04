/**
 * Certification applications and their certificates, shared by the Join
 * page, the API, the admin console and the public /verify page.
 */
import { CERT_TRACKS, type CertTrack } from "../data/certifications";

export const CERT_STATUSES = ["applied", "in_review", "on_hold", "rejected", "certified"] as const;

export type CertStatus = (typeof CERT_STATUSES)[number];

/** Still being decided: a person has at most one of these per path */
export const OPEN_STATUSES: CertStatus[] = ["applied", "in_review", "on_hold"];

export type TrackId = CertTrack["id"];

export function isCertStatus(value: unknown): value is CertStatus {
  return typeof value === "string" && (CERT_STATUSES as readonly string[]).includes(value);
}

export function isTrackId(value: unknown): value is TrackId {
  return CERT_TRACKS.some((track) => track.id === value);
}

/** English labels, for the admin console */
export const CERT_STATUS_LABELS: Record<CertStatus, string> = {
  applied: "Applied",
  in_review: "In review",
  on_hold: "On hold",
  rejected: "Rejected",
  certified: "Certified",
};

export type CertificateState = "valid" | "expired" | "revoked";

/**
 * Whether a certificate still counts: certified and not past its expiry.
 * "revoked" is a certificate whose application an admin moved away from
 * certified after issuing it.
 */
export function certificateState(
  app: { status: CertStatus; expiresAt: string | null },
  now: Date = new Date()
): CertificateState {
  if (app.status !== "certified" || !app.expiresAt) return "revoked";
  return now.getTime() < new Date(app.expiresAt).getTime() ? "valid" : "expired";
}

export const DEFAULT_VALID_YEARS = 2;

/** The expiry an admin starts from when certifying: 2 years on, as YYYY-MM-DD */
export function defaultExpiry(from: Date = new Date()): string {
  const date = new Date(from);
  date.setUTCFullYear(date.getUTCFullYear() + DEFAULT_VALID_YEARS);
  return date.toISOString().slice(0, 10);
}

export const MAX_VALID_YEARS = 10;

/**
 * Checks the expiry an admin chose (YYYY-MM-DD, UTC): a real date after
 * today and no more than 10 years ahead. Returns the end of that day as an
 * ISO timestamp, so the certificate is valid through the whole date.
 */
export function parseExpiry(value: unknown, now: Date = new Date()): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const end = new Date(`${value}T23:59:59.999Z`);
  if (Number.isNaN(end.getTime()) || end.toISOString().slice(0, 10) !== value) return null;

  const latest = new Date(now);
  latest.setUTCFullYear(latest.getUTCFullYear() + MAX_VALID_YEARS);

  return end > now && end <= latest ? end.toISOString() : null;
}

export type ApplicationInput = {
  track: TrackId;
  name: string;
  phone: string;
  location: string;
  notes: string;
};

function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length <= max ? trimmed : null;
}

/** An application from the Join page: name, phone and district are required */
export function parseApplication(value: unknown): ApplicationInput | null {
  const raw = (value ?? {}) as Record<string, unknown>;
  const name = text(raw.name, 120);
  const phone = text(raw.phone, 40);
  const location = text(raw.location, 120);
  const notes = text(raw.notes ?? "", 1000);

  if (!isTrackId(raw.track) || !name || !phone || !location || notes === null) return null;

  return { track: raw.track, name, phone, location, notes };
}
