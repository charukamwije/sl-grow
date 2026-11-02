/**
 * The public URL of this deployment. Page metadata, robots.txt and the
 * sitemap all have to agree on it, so it comes from the environment, falling
 * back to the Vercel production domain and then to local development.
 */
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const SITE_URL = (
  process.env.SITE_URL ??
  (vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000")
).replace(/\/+$/, "");

export const SITE_NAME = "Home Veggie Shop & Planner";

export const SITE_DESCRIPTION =
  "Plan a home vegetable garden in Sri Lanka, see what it costs and saves, buy seedlings and supplies, and order on WhatsApp. In English, Sinhala and Tamil.";
