import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent bundling of Node-native modules used in API routes
  serverExternalPackages: ["pdf-parse", "mammoth"],
};

export default nextConfig;
