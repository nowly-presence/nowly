import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  transpilePackages: ["@nowly/analytics", "@nowly/ui"],
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["@nowly/ui"],
  },
};

export default nextConfig;
