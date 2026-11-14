// First import: globals.css declares the cascade-layer order Astryx and Tailwind rely on.
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Asta_Sans, Bricolage_Grotesque, Noto_Sans, Noto_Sans_Khmer, Noto_Sans_Thai } from "next/font/google";
import { I18n } from "@/components/I18n";
import { getLang } from "@/lib/auth";
import { dictOf } from "@/lib/messages";
import { Providers } from "./providers";

// Display: Bricolage Grotesque for Latin; Asta Sans carries Hangul and body text (picked with the design skill's font data).
const brand = Bricolage_Grotesque({ variable: "--font-brand", subsets: ["latin", "latin-ext", "vietnamese"] });
const body = Asta_Sans({ variable: "--font-body", subsets: ["latin"] });
// Body faces for scripts Asta Sans lacks. preload: false, so they download only when that language is on screen.
const noto = Noto_Sans({ variable: "--font-noto", subsets: ["latin", "latin-ext", "vietnamese", "cyrillic", "cyrillic-ext", "devanagari"], preload: false });
const thai = Noto_Sans_Thai({ variable: "--font-thai", subsets: ["thai"], preload: false });
const khmer = Noto_Sans_Khmer({ variable: "--font-khmer", subsets: ["khmer"], preload: false });

export const metadata: Metadata = {
  title: { default: "Boundless", template: "%s · Boundless" },
  description: "국경 없이 누구나 어우러지는 한국 생활 커뮤니티 · A borderless community for everyone living in Korea",
};

// viewportFit cover: without it iOS reports env(safe-area-inset-*) as 0, so the bottom nav sits on the home indicator in the installed app.
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1B3A6B", viewportFit: "cover" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const lang = await getLang();
  return (
    <html lang={lang} className={`${brand.variable} ${body.variable} ${noto.variable} ${thai.variable} ${khmer.variable} h-full antialiased`}>
      <body className="min-h-full pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] font-sans">
        <Providers>
          <I18n dict={dictOf(lang)}>{children}</I18n>
        </Providers>
      </body>
    </html>
  );
}
