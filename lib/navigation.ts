import type { WCCategory, WCProduct } from "@/lib/woocommerce/types";

// Orden y nombres de los tipos (categorías) en el filtro de la tienda. Los menús de la web
// se editan en WordPress (Apariencia → Menús).


// Orden y nombres de los tipos tal y como salen en la web real.
const TYPE_ORDER = ["t-shirts", "sweatshirts", "accesories", "accessories", "mugs", "prints"];
const TYPE_LABELS: Record<string, string> = { "t-shirts": "T-shirts" };

export function sortTypes(categories: WCCategory[]) {
  return [...categories].sort((a, b) => {
    const ia = TYPE_ORDER.indexOf(a.slug);
    const ib = TYPE_ORDER.indexOf(b.slug);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}

export const typeLabel = (c: WCCategory) => TYPE_LABELS[c.slug] ?? c.name;

/** Posición de un producto según su tipo: el primero de TYPE_ORDER entre sus categorías. */
function typeRank(product: WCProduct) {
  const ranks = product.categories.map((c) => TYPE_ORDER.indexOf(c.slug)).filter((i) => i !== -1);
  return ranks.length ? Math.min(...ranks) : 99;
}

/**
 * Productos ordenados por tipo, igual que el filtro de la tienda: primero la ropa
 * (camisetas, sudaderas), luego accesorios, mugs y por último prints. Dentro de cada tipo
 * se mantiene el orden que traían (el más nuevo primero, o el elegido en la colección).
 */
export function sortProductsByType(products: WCProduct[]) {
  return products
    .map((p, i) => ({ p, i, rank: typeRank(p) }))
    .sort((a, b) => a.rank - b.rank || a.i - b.i)
    .map(({ p }) => p);
}
