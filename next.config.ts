import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone', // Оптимизация для Docker
};

export default nextConfig;
