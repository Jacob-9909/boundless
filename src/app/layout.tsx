import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { getLang } from "@/lib/auth";
import "./globals.css";

const brand = Bricolage_Grotesque({ variable: "--font-brand", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Boundless", template: "%s · Boundless" },
  description: "국경 없이 누구나 어우러지는 한국 생활 커뮤니티 · A borderless community for everyone living in Korea",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const lang = await getLang();
  return (
    <html lang={lang} className={`${brand.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
