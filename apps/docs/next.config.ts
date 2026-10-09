import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const basePath = (process.env.NEXT_PUBLIC_DOCS_BASE_PATH ?? "").replace(/\/$/, "");

const legacyRedirects = [
  {
    source: "/docs",
    destination: "/",
    permanent: true,
  },
  {
    source: "/docs/:path*",
    destination: "/:path*",
    permanent: true,
  },
];

const zoneRedirects = [
  {
    source: "/:path*",
    has: [{ type: "host" as const, value: "docs.nowly.me" }],
    destination: `https://nowly.me${basePath}/:path*`,
    basePath: false as const,
    permanent: true,
  },
];

const nextConfig: NextConfig = {
  ...(basePath ? { basePath } : {}),
  compress: true,
  poweredByHeader: false,
  transpilePackages: ["@nowly/ui", "@nowly/locales"],
  experimental: {
    optimizePackageImports: ["@nowly/ui"],
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.nowly.me" }],
  },
  async rewrites() {
    return [
      {
        source: "/favicon.ico",
        destination: "https://cdn.nowly.me/brand/favicons/favicon-32.png",
      },
    ];
  },
  async redirects() {
    return basePath ? zoneRedirects : legacyRedirects;
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
