import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const docsBase = "https://docs.nowly.me";

const docsZone = (process.env.DOCS_ZONE_URL ?? "").replace(/\/$/, "");

const docsRedirects = docsZone
  ? []
  : [
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

const nextConfig: NextConfig = {
  compress: true,
  transpilePackages: ["@nowly/analytics", "@nowly/ui", "@nowly/locales"],
  poweredByHeader: false,
  experimental: {
    globalNotFound: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.nowly.me" },
    ],
  },
  async rewrites() {
    if (!docsZone) return [];
    return {
      beforeFiles: [
        { source: "/docs", destination: `${docsZone}/docs` },
        { source: "/docs/:path+", destination: `${docsZone}/docs/:path+` },
      ],
    };
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.nowly.me" }],
        destination: "https://nowly.me/:path*",
        permanent: true,
      },
      ...docsRedirects,
      {
        source: "/about",
        destination: "/",
        permanent: true,
      },
      {
        source: "/:slug-discord-rich-presence",
        destination: "/library/:slug",
        permanent: true,
      },
      {
        source: "/:slug-rich-presence",
        destination: "/library/:slug",
        permanent: true,
      },
      {
        source: "/host",
        destination: "/desktop",
        permanent: true,
      },
      {
        source: "/redem",
        destination: "/support",
        permanent: true,
      },
      {
        source: "/support/redeem",
        destination: "/support",
        permanent: true,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withNextIntl(nextConfig);
