import type { MetadataRoute } from "next";

/** Installable web app: "Add to Home Screen" opens the feed full-screen. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Boundless",
    short_name: "Boundless",
    description: "A borderless community for everyone living in Korea · 국경 없이 어우러지는 한국 생활 커뮤니티",
    start_url: "/feed",
    display: "standalone",
    background_color: "#F3F6FB",
    theme_color: "#1B3A6B",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
