"use client";

import { useEffect, useState } from "react";
import type { WCProduct } from "@/lib/woocommerce/types";
import { ProductGrid } from "./ProductGrid";

const COUNT = 4;

/** Copia de la lista en orden aleatorio (Fisher–Yates). */
function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * «You may also like» en orden aleatorio, distinto en cada visita: primero los productos de
 * la misma colección (mezclados entre sí) y, si no llegan a 4, se completan con otros del
 * catálogo (también mezclados).
 *
 * La ficha se sirve ya generada (igual para todos), así que la mezcla se hace en el
 * navegador al cargar. El primer pintado usa el orden que llega del servidor, para que el
 * HTML coincida con el del servidor; justo después se mezcla. El bloque está al final de la
 * página, así que el cambio no se llega a ver.
 */
export function RelatedProductsGrid({ collection, others }: { collection: WCProduct[]; others: WCProduct[] }) {
  const [products, setProducts] = useState(() => [...collection, ...others].slice(0, COUNT));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mezcla solo en el navegador (ver arriba)
    setProducts([...shuffle(collection), ...shuffle(others)].slice(0, COUNT));
  }, [collection, others]);

  return <ProductGrid products={products} variant="related" keepOrder />;
}
