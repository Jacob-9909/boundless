import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-hosted on oracle_vm like triplan: `node server.js` from .next/standalone.
  output: "standalone",
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
