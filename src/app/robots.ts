import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ftkathletics.com";

/**
 * Belt-and-suspenders alongside sitemap.ts: that file only lists what
 * SHOULD be indexed, this one explicitly blocks what shouldn't be —
 * account-scoped pages, the registration wizard (mid-flow state has no
 * business being crawled), admin, auth callback/reset flows, and the API
 * itself. None of these are reachable without a session anyway, but
 * keeping them out of robots.txt too means they never show up in search
 * results even transiently (e.g. a redirect getting indexed).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/register", "/profile", "/admin", "/auth", "/api"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
