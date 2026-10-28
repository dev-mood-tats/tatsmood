import { Suspense } from "react";
import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RevealImages } from "@/components/RevealImages";
import { CookieBanner } from "@/components/CookieBanner";
import { ConsentScripts } from "@/components/ConsentScripts";
import { SITE_NAME, siteUrl } from "@/lib/seo";
import "./globals.css";
import "./wp-content.css";
import "./home.css";
import "./reveal.css";

// Tipografía de marca (idéntica a la web original en WordPress/Elementor): Inter Tight.
const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  weight: ["300", "400", "500", "600"],
});

// SEO por defecto; cada página añade lo suyo (lib/seo.ts). Títulos «Página – tatsmood».
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: SITE_NAME,
    template: `%s – ${SITE_NAME}`,
  },
  description: "Graphic design brand founded and based in Valencia, Spain: merchandising based on wellness, nature and life lessons.",
  applicationName: SITE_NAME,
  openGraph: { siteName: SITE_NAME, type: "website", locale: "en_US" },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full antialiased ${interTight.variable}`}>
      <body className="relative min-h-full flex flex-col font-sans">
        <Header />
        <main className="flex-1 pt-[55px] lg:pt-16">{children}</main>
        {/* El pie lee los menús de WordPress: dentro de <Suspense> para que, si su caché acaba
            de caducar (p. ej. tras guardar en WordPress), no bloquee el prerenderizado. */}
        <Suspense fallback={<footer className="site-footer mt-[100px] h-16 lg:mt-[150px]" />}>
          <Footer />
        </Suspense>
        <RevealImages />
        <CookieBanner />
        <ConsentScripts />
      </body>
    </html>
  );
}
