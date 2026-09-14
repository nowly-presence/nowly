import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const docsBase = (process.env.NEXT_PUBLIC_DOCS_BASE_URL ?? "https://docs.nowly.me").replace(/\/$/, "");
 
const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.nowly.me" }]
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
        source: "/library/privacy",
        destination: "/privacy",
        permanent: true,
      },
      {
        source: "/docs/privacy",
        destination: "/privacy",
        permanent: true,
      },
      {
        source: "/docs/:section/privacy",
        destination: "/privacy",
        permanent: true,
      },
      {
        source: "/docs/:section/:page/privacy",
        destination: "/privacy",
        permanent: true,
      },
      {
        source: "/docs",
        destination: `${docsBase}/docs`,
        permanent: true,
      },
      {
        source: "/docs/:path*",
        destination: `${docsBase}/docs/:path*`,
        permanent: true,
      },
      {
        source: "/llms.txt",
        destination: `${docsBase}/llms.txt`,
        permanent: true,
      },
      {
        source: "/llms-full.txt",
        destination: `${docsBase}/llms-full.txt`,
        permanent: true,
      },
      {
        source: "/api/search",
        destination: `${docsBase}/api/search`,
        permanent: true,
      },
      {
        source: "/api/og/docs/:path*",
        destination: `${docsBase}/api/og/docs/:path*`,
        permanent: true,
      },
      {
        source: "/library/:slug/privacy",
        destination: "/privacy",
        permanent: true,
      },
      {
        source: "/library/:slug/comments",
        destination: "/:slug-discord-rich-presence",
        permanent: true,
      },
      {
        source: "/library/:slug-discord-rich-presence",
        destination: "/:slug-discord-rich-presence",
        permanent: true,
      },
      {
        source: "/library/:slug-rich-presence",
        destination: "/:slug-discord-rich-presence",
        permanent: true,
      },
      {
        source: "/library/:slug",
        destination: "/:slug-discord-rich-presence",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/uninstall",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/consent",
        headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }],
      },
    ];
  },
};
 
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
