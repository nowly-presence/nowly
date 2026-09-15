import { DOCS_URL } from "@/lib/constants";
import type { MetadataRoute } from "next";

const robots = (): MetadataRoute.Robots => ({
  rules: [
    {
      userAgent: "*",
      allow: ["/", "/api/og/"],
      disallow: ["/api/"],
    },
  ],
  sitemap: `${DOCS_URL}/sitemap.xml`,
  host: DOCS_URL,
});

export default robots;
