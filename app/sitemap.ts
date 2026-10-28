import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";
import { getCollectionPages } from "@/lib/wordpress/content";
import { getAllProductSlugs, getCategories } from "@/lib/woocommerce/catalog";

// sitemap.xml automático: home, tienda, tipos, colecciones, productos y páginas de texto.
// Se actualiza solo con lo que haya publicado en WordPress.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [products, categories, collections] = await Promise.all([
    getAllProductSlugs().catch(() => []),
    getCategories().catch(() => []),
    getCollectionPages().catch(() => []),
  ]);
  const url = (path: string, priority: number) => ({ url: `${base}${path}`, priority });
  return [
    url("/", 1),
    url("/store", 0.9),
    ...collections.map((c) => url(`/${c.slug}`, 0.8)),
    ...categories.map((c) => url(`/store/${c.slug}`, 0.7)),
    ...products.map((slug) => url(`/product/${slug}`, 0.8)),
    ...["/faqs", "/legal-notice", "/privacy-policy", "/cookie-policy"].map((p) => url(p, 0.3)),
  ];
}
