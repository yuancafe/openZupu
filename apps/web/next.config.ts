import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't fail build on TypeScript warnings during CI deploy
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;