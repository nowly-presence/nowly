import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
 
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
