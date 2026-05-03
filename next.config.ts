import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/snapbook',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
