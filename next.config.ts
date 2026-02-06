import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Running as server for API routes to work
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
