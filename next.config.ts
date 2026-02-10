import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Speed up development builds
  reactStrictMode: false, // Disable in development to avoid double rendering
  
  // Turbopack config (Next.js 16+ uses Turbopack by default)
  turbopack: {},
  
  // Allow all local network origins for LAN testing
  allowedDevOrigins: ['*'],
};

export default nextConfig;
