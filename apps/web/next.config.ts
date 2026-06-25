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
        source: "/library/:slug-rich-presence",
        destination: "/library/:slug-discord-rich-presence",
        permanent: true,
      },
    ];
  },
};
 
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);