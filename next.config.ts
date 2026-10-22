import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next's built-in optimizer needs a Node image server or Cloudflare
    // Images (a separate paid product) — neither is available on Workers
    // Free. Assets in /public are pre-compressed instead (see scripts/).
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
