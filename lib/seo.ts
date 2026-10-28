import type { Metadata } from "next";
import { decodeEntities } from "@/lib/format";

// SEO automático: cada página saca su título, descripción e imagen para redes de los
// datos que ya hay en WordPress/WooCommerce, así Tat no tiene que rellenar nada.
// Títulos como en Paloma Wool: «Swag T-Shirt – tatsmood» (plantilla en app/layout.tsx).

export const SITE_NAME = "tatsmood";

/** Dirección pública de la web (variable SITE_URL; en local, localhost). */
export const siteUrl = () => (process.env.SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

/** Texto plano de un HTML de WordPress, recortado a `max` caracteres (sin cortar palabras). */
export function plainText(html: string | null | undefined, max = 160): string {
  const text = decodeEntities((html ?? "").replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, text.lastIndexOf(" ", max - 1)).replace(/[,.;:\s]+$/, "")}…`;
}

type Img = { url?: string; src?: string; width?: number; height?: number; alt?: string } | null | undefined;

/** Metadatos de una página: título, descripción, dirección canónica e imagen para redes. */
export function pageMetadata({ title, description, path, image }: { title?: string; description?: string; path: string; image?: Img }): Metadata {
  const url = image?.url ?? image?.src;
  const images = url ? [{ url, width: image?.width, height: image?.height, alt: image?.alt || title }] : undefined;
  return {
    title,
    description: description || undefined,
    alternates: { canonical: path },
    openGraph: { title: title ? `${title} – ${SITE_NAME}` : SITE_NAME, description: description || undefined, url: path, images },
    twitter: { card: "summary_large_image", images: url ? [url] : undefined },
  };
}
