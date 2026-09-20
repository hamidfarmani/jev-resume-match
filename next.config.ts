import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep PDF.js and the native canvas module in the Node.js runtime.
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
};

export default nextConfig;
