import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.nowly.me").replace(/\/$/, "");
const SUBMISSION_IMAGES_ORIGIN = process.env.NEXT_PUBLIC_SUBMISSION_IMAGES_ORIGIN ?? "https://cdn.nowly.me";
const isDevelopment = process.env.NODE_ENV !== "production";
const HSTS_MAX_AGE_SECONDS = 63_072_000;

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://cdn.discordapp.com ${SUBMISSION_IMAGES_ORIGIN}`,
  "font-src 'self'",
  `connect-src 'self' ${API_ORIGIN}`,
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'none'",
  "object-src 'none'"
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff"
  },
  {
    key: "Referrer-Policy",
    value: "same-origin"
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()"
  },
  {
    key: "X-Robots-Tag",
    value: "noindex, nofollow"
  },
  ...(isDevelopment
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: `max-age=${HSTS_MAX_AGE_SECONDS}; includeSubDomains`
        }
      ])
];

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  transpilePackages: ["@nowly/ui", "@nowly/locales", "@nowly/shared"],
  experimental: {
    optimizePackageImports: ["@nowly/ui"]
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders
      }
    ];
  }
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);