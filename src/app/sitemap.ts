import type { MetadataRoute } from "next";
import { programs } from "@/data/programs";
import { programCategories } from "@/data/program-categories";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ftkathletics.com";

/**
 * Public pages only. Everything under /register, /profile, /admin, /auth,
 * and /api is deliberately left out — those are per-account or internal
 * and have no reason to be crawled or listed, independent of whatever
 * robots.txt also says (see src/app/robots.ts).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/programs`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/schedule`, changeFrequency: "weekly", priority: 0.7 },
  ];

  const programRoutes: MetadataRoute.Sitemap = programs.map((program) => ({
    url: `${siteUrl}/programs/${program.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Category pages with exactly one program redirect straight to that
  // program's own page (src/app/programs/category/[slug]/page.tsx) — still
  // a valid, single canonical destination, so no reason to exclude them.
  const categoryRoutes: MetadataRoute.Sitemap = programCategories.map((category) => ({
    url: `${siteUrl}/programs/category/${category.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...programRoutes, ...categoryRoutes];
}
