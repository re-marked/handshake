import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { GUIDE, GUIDE_UPDATED } from "@/lib/guide";

export const dynamic = "force-static";

// Bump when the corresponding page's content meaningfully changes.
const HOME_UPDATED = "2026-07-10";
const DOWNLOAD_UPDATED = "2026-07-10";
const FAQ_UPDATED = "2026-07-10";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: HOME_UPDATED,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/download/`,
      lastModified: DOWNLOAD_UPDATED,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/faq/`,
      lastModified: FAQ_UPDATED,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/guide/`,
      lastModified: GUIDE_UPDATED,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...GUIDE.map((s) => ({
      url: `${SITE_URL}/guide/${s.slug}/`,
      lastModified: GUIDE_UPDATED,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
