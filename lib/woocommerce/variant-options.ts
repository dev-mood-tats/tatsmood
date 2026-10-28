import { getWooConfig } from "@/lib/config";
import type { WCProductAttribute } from "./types";

// En WooCommerce un atributo puede tener términos que no se usan en ninguna variación
// (p. ej. Circles Hoodie tiene Size S/M/L/XL pero solo variaciones S, M y L). La API
// REST devuelve todos los términos en `attributes[].options`, así que aquí se cruzan con
// las variaciones que existen de verdad (Store API pública, una sola petición para todos
// los productos) y se quitan las opciones que no tienen variación.

type StoreProduct = {
  id: number;
  variations?: { id: number; attributes: { name: string; value: string | null }[] }[];
};

const norm = (s: string) => s.trim().toLowerCase();

export async function fetchUsedVariantValues(productIds: number[]): Promise<Record<number, Record<string, Set<string> | "any">>> {
  const ids = Array.from(new Set(productIds));
  if (ids.length === 0) return {};
  const { url } = getWooConfig();
  const out: Record<number, Record<string, Set<string> | "any">> = {};

  // La Store API admite hasta 100 por página.
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const res = await fetch(
      `${url}/wp-json/wc/store/v1/products?include=${chunk.join(",")}&per_page=100&_fields=id,variations`,
      { cache: "no-store" },
    ).catch(() => null);
    if (!res?.ok) continue;
    const products = (await res.json()) as StoreProduct[];
    for (const p of products) {
      const byAttr: Record<string, Set<string> | "any"> = {};
      for (const v of p.variations ?? []) {
        for (const a of v.attributes) {
          const key = norm(a.name);
          if (byAttr[key] === "any") continue;
          // Variación "Cualquier talla": vale para todas las opciones.
          if (!a.value) {
            byAttr[key] = "any";
            continue;
          }
          const set = (byAttr[key] as Set<string> | undefined) ?? new Set<string>();
          set.add(norm(a.value));
          byAttr[key] = set;
        }
      }
      out[p.id] = byAttr;
    }
  }
  return out;
}

/** Deja en cada atributo de variación solo las opciones que tienen variación. */
export function filterAttributeOptions(
  attributes: WCProductAttribute[],
  used: Record<string, Set<string> | "any"> | undefined,
): WCProductAttribute[] {
  if (!used) return attributes;
  return attributes.map((attr) => {
    if (!attr.variation) return attr;
    const values = used[norm(attr.name)];
    if (!values || values === "any") return attr;
    // El valor de la variación puede venir como nombre ("XL") o como slug ("xl").
    const slug = (s: string) => norm(s).replace(/\s+/g, "-");
    return { ...attr, options: attr.options.filter((o) => values.has(norm(o)) || values.has(slug(o))) };
  });
}
