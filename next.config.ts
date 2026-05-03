import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/snapbook',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
