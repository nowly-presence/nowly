import { DOCS_URL, isSeoPreview } from "@/lib/constants";
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
        allow: ["/", "/api/og/"],
        disallow: ["/api/"],
      },
    ],
    sitemap: `${DOCS_URL}/sitemap.xml`,
    host: DOCS_URL,
  };
};

export default robots;
