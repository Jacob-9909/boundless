import type { Metadata, Viewport } from "next";
import { Asta_Sans, Bricolage_Grotesque } from "next/font/google";
import { getLang } from "@/lib/auth";
import "./globals.css";

// Display: Bricolage Grotesque for Latin; Asta Sans carries Hangul and body text (picked with the design skill's font data).
const brand = Bricolage_Grotesque({ variable: "--font-brand", subsets: ["latin"] });
const body = Asta_Sans({ variable: "--font-body", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Boundless", template: "%s · Boundless" },
  description: "국경 없이 누구나 어우러지는 한국 생활 커뮤니티 · A borderless community for everyone living in Korea",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const lang = await getLang();
  return (
    <html lang={lang} className={`${brand.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
