import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
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
    return [
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
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
