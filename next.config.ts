import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove static export to support dynamic routes properly
  basePath: '/countdown',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
};

export default nextConfig;
