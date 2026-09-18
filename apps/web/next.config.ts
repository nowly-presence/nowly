import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const docsBase = "https://docs.nowly.me";

const nextConfig: NextConfig = {
  compress: true,
  transpilePackages: ["@nowly/analytics", "@nowly/ui"],
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["@nowly/ui"],
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
      {
        source: "/host",
        destination: "/desktop",
        permanent: true,
      },
      {
        source: "/redem",
        destination: "/redeem",
        permanent: true,
      },
      {
        source: "/support/redeem",
        destination: "/redeem",
        permanent: true,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withNextIntl(nextConfig);
