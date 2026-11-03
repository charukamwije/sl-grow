import { MetadataRoute } from "next";
import { GUIDES } from "@/lib/data/guides";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/planner", "/shop", "/guides", "/plantation", "/join"].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const guides = GUIDES.map((guide) => ({
    url: `${SITE_URL}/guides/${guide.id}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...pages, ...guides];
}
