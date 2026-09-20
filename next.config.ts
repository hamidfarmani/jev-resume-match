import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse resolves its PDF.js worker relative to its installed package.
  // Bundling it into a route moves that reference into .next/server/chunks.
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
