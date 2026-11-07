import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-hosting on a VM runs `node server.js` from .next/standalone; Vercel builds its own output.
  output: process.env.VERCEL ? undefined : "standalone",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
