import { CANONICAL_ORIGIN, DOCS_ORIGIN, isSeoPreview } from "@/features/seo/lib/seo";
import type { MetadataRoute } from "next";

const robots = (): MetadataRoute.Robots => {
  if (isSeoPreview) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/og"],
        disallow: ["/api/", "/host/", "/test/"],
      },
    ],
    sitemap: DOCS_ORIGIN.startsWith(`${CANONICAL_ORIGIN}/`)
      ? [`${CANONICAL_ORIGIN}/sitemap.xml`, `${DOCS_ORIGIN}/sitemap.xml`]
      : `${CANONICAL_ORIGIN}/sitemap.xml`,
    host: CANONICAL_ORIGIN,
  };
};

export default robots;
