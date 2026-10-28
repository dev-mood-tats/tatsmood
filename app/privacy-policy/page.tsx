import { WPPage, wpPageMetadata } from "@/components/WPPage";

export const generateMetadata = () => wpPageMetadata("privacy-policy");

// Contenido: WordPress → Páginas → «Privacy Policy».
export default function PrivacyPolicyPage() {
  return <WPPage slug="privacy-policy" />;
}
