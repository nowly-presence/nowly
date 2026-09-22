import { CANONICAL_ORIGIN, isSeoPreview } from "@/lib/seo";
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
    sitemap: `${CANONICAL_ORIGIN}/sitemap.xml`,
    host: CANONICAL_ORIGIN,
  };
};

export default robots;
