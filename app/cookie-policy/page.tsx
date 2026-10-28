import { WPPage, wpPageMetadata } from "@/components/WPPage";

export const generateMetadata = () => wpPageMetadata("cookie-policy");

// Contenido: WordPress → Páginas → «Cookie Policy».
export default function CookiePolicyPage() {
  return <WPPage slug="cookie-policy" />;
}
