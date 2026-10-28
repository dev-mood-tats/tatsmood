import type { WCCategory } from "@/lib/woocommerce/types";

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
