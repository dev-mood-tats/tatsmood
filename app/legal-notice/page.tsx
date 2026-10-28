import { WPPage, wpPageMetadata } from "@/components/WPPage";

export const generateMetadata = () => wpPageMetadata("legal-notice");

// Contenido: WordPress → Páginas → «Legal Notice».
export default function LegalNoticePage() {
  return <WPPage slug="legal-notice" />;
}
