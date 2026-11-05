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
        {/* Texto a 12px: en iPhone/iPad, Safari hace zoom al tocar un campo (el buscador del
            menú) porque es menor de 16px. Con maximum-scale=1 deja de hacerlo, y en iOS se
            puede seguir ampliando con los dedos (Safari ignora ese límite para el pellizco).
            Solo en iOS: en Android sí bloquearía el pellizco (y allí no hace ese zoom). Lo mismo
            que en el checkout de WordPress (tema tatsmood-headless, header.php). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if(/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1)){var m=document.querySelector('meta[name="viewport"]');if(m)m.content="width=device-width, initial-scale=1, maximum-scale=1";}`,
          }}
        />
        <Header />
        {/* Sin relleno arriba: la cabecera es «sticky» y ya ocupa su sitio en la página. */}
        <main className="flex-1">{children}</main>
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
