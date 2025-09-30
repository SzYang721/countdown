import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/countdown',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
};

export default nextConfig;
