import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const docsBase = (process.env.NEXT_PUBLIC_DOCS_BASE_URL ?? "https://docs.nowly.me").replace(/\/$/, "");

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["@remixicon/react", "@base-ui/react"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.nowly.me" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.nowly.me" }],
        destination: "https://nowly.me/:path*",
        permanent: true,
      },
      {
        source: "/docs",
        destination: `${docsBase}/`,
        permanent: true,
      },
      {
        source: "/docs/:path*",
        destination: `${docsBase}/:path*`,
        permanent: true,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withNextIntl(nextConfig);
