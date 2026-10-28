import { cacheLife, cacheTag } from "next/cache";
import { resolveAcfForProducts, withImageSizes } from "./acf";
import { decodeEntities } from "@/lib/format";
import { wooFetch } from "./client";
import { fetchUsedVariantValues, filterAttributeOptions } from "./variant-options";
import type { WCCategory, WCProduct, WCVariation } from "./types";

// Lecturas del catálogo, con caché de Next.js ("use cache") para que navegar entre
// páginas sea rápido: cada respuesta se guarda y se reutiliza; pasado 1 minuto se vuelve
// a pedir a WooCommerce en segundo plano (se sirve la guardada mientras tanto). Así, un
// cambio en WooCommerce tarda como mucho ~1 minuto en verse. Todas llevan la etiqueta
// "catalog" para poder vaciarlas a mano (revalidateTag("catalog")), p. ej. desde un
// webhook de WooCommerce más adelante.
// (El carrito NO pasa por aquí: va siempre en directo por la Store API.)
// Los cambios de WooCommerce llegan al momento por webhook (app/api/revalidate/route.ts),
// así que en producción la caché puede durar mucho: se refresca sola en segundo plano
// cada hora como red de seguridad y se guarda hasta 1 semana. En local (sin webhooks,
// porque WordPress no puede avisar a tu ordenador) se refresca cada minuto.
const REVALIDATE = process.env.NODE_ENV === "production" ? 60 * 60 : 60;
function catalogCache() {
  cacheLife({ stale: 300, revalidate: REVALIDATE, expire: 60 * 60 * 24 * 7 });
  cacheTag("catalog");
}

// La API de WooCommerce no tipa meta_data, pero siempre viene en /products y /products/{id}.
type RawWCProduct = Omit<WCProduct, "acf"> & { meta_data?: { key: string; value: unknown }[] };

async function withAcf(raws: RawWCProduct[]): Promise<WCProduct[]> {
  const variableIds = raws.filter((p) => p.type === "variable").map((p) => p.id);
  const [acfMap, usedValues] = await Promise.all([
    resolveAcfForProducts(raws),
    fetchUsedVariantValues(variableIds).catch(() => ({}) as Awaited<ReturnType<typeof fetchUsedVariantValues>>),
  ]);
  return raws.map((p) => ({
    ...p,
    // WooCommerce devuelve el nombre con entidades HTML (p. ej. "&lt;3? T-shirt").
    name: decodeEntities(p.name),
    attributes: p.type === "variable" ? filterAttributeOptions(p.attributes, usedValues[p.id]) : p.attributes,
    acf: acfMap[p.id],
  }));
}

export async function getProducts(
  opts: { categoryId?: number; tagId?: number; featured?: boolean; perPage?: number; search?: string; include?: number[] } = {},
) {
  "use cache";
  catalogCache();
  const raw = await wooFetch<RawWCProduct[]>("/products", {
    query: {
      status: "publish",
      per_page: opts.perPage ?? 24,
      category: opts.categoryId,
      tag: opts.tagId,
      featured: opts.featured ? "true" : undefined,
      search: opts.search || undefined,
      include: opts.include?.length ? opts.include.join(",") : undefined,
      orderby: "date",
      order: "desc",
    },
  });
  return withAcf(raw);
}

export async function getProductBySlug(slug: string): Promise<WCProduct | null> {
  "use cache";
  catalogCache();
  const products = await wooFetch<RawWCProduct[]>("/products", {
    query: { slug, status: "publish" },
  });
  if (!products[0]) return null;
  const [[withAcfProduct], images] = await Promise.all([withAcf([products[0]]), withImageSizes(products[0].images)]);
  return { ...withAcfProduct, images };
}

/** Slugs de todos los productos publicados (para generar sus fichas al hacer el build). */
export async function getAllProductSlugs(): Promise<string[]> {
  "use cache";
  catalogCache();
  const slugs: string[] = [];
  for (let page = 1; ; page++) {
    const batch = await wooFetch<{ slug: string }[]>("/products", {
      query: { status: "publish", per_page: 100, page, _fields: "slug" },
    });
    slugs.push(...batch.map((p) => p.slug));
    if (batch.length < 100) break;
  }
  return slugs;
}

export async function getCategories() {
  "use cache";
  catalogCache();
  return wooFetch<WCCategory[]>("/products/categories", {
    query: { hide_empty: "true", per_page: 100, orderby: "name" },
  }).then((cats) => cats.filter((c) => c.slug !== "uncategorized" && c.slug !== "sin-categorizar"));
}

export async function getProductVariations(productId: number) {
  "use cache";
  catalogCache();
  return wooFetch<WCVariation[]>(`/products/${productId}/variations`, {
    query: { per_page: 100 },
  });
}

/** Productos por id, en el mismo orden que se piden (los que no existan se omiten). */
export async function getProductsInOrder(ids: number[]): Promise<WCProduct[]> {
  if (ids.length === 0) return [];
  const products = await getProducts({ include: ids.slice(0, 100), perPage: Math.min(ids.length, 100) });
  return products.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
}
