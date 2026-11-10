import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-hosting on a VM runs `node server.js` from .next/standalone; Vercel builds its own output.
  output: process.env.VERCEL ? undefined : "standalone",
  // Posts carry up to four photos, each shrunk in the browser to well under 600 KB (Vercel allows 4.5 MB).
  experimental: { serverActions: { bodySizeLimit: "3mb" } },
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
