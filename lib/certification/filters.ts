import { cleanSearch, one } from "../order-filters";
import { isCertStatus, isTrackId, type CertStatus, type TrackId } from "./status";

export type ApplicationFilters = {
  q: string;
  status: CertStatus | null;
  track: TrackId | null;
  page: number;
};

/** What the admin certifications page can be filtered by, from its query string */
export function parseApplicationFilters(
  params: Record<string, string | string[] | undefined>
): ApplicationFilters {
  const page = Number(one(params.page));
  const status = one(params.status);
  const track = one(params.track);

  return {
    q: cleanSearch(one(params.q)),
    status: isCertStatus(status) ? status : null,
    track: isTrackId(track) ? track : null,
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

export function applicationFiltersQuery(filters: ApplicationFilters, page: number): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("status", filters.status);
  if (filters.track) params.set("track", filters.track);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `?${query}` : "";
}
