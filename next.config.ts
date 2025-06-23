import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during builds to prevent warnings from blocking deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Only run type checking, don't fail on warnings
    ignoreBuildErrors: false,
  },
}

export default nextConfig;
