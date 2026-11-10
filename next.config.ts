import { execSync } from "node:child_process";
import type { NextConfig } from "next";

const git = (args: string) => {
  try {
    return execSync(`git ${args}`, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "";
  }
};
// The version people see in the footer: the commit's date and short hash, e.g. "2026.11.10 · 7d311da".
// CI builds on GitHub Actions (GITHUB_SHA); Vercel's own builds set VERCEL_GIT_COMMIT_SHA; locally git answers.
const sha = (process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || git("rev-parse HEAD")).slice(0, 7);
const day = (git("log -1 --format=%cs") || new Date().toISOString().slice(0, 10)).replaceAll("-", ".");

const nextConfig: NextConfig = {
  // Self-hosting on a VM runs `node server.js` from .next/standalone; Vercel builds its own output.
  output: process.env.VERCEL ? undefined : "standalone",
  env: { APP_BUILD: sha ? `${day} · ${sha}` : day },
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
