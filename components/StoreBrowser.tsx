"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import type { WCCategory, WCProduct } from "@/lib/woocommerce/types";
import { ProductGrid } from "./ProductGrid";

// Tienda con el filtro de categorías "tipo AJAX", como en la web real: todos los
// productos llegan una sola vez y al pulsar un filtro se filtran al momento en el
// navegador, sin volver a cargar la página. La URL cambia igualmente (/store o
// /store/<categoría>) para poder compartirla y para que funcione el botón "atrás".
export function StoreBrowser({
  products,
  categories,
  initialCategory = null,
}: {
  products: WCProduct[];
  categories: WCCategory[];
  initialCategory?: string | null;
}) {
  const [active, setActive] = useState<string | null>(initialCategory);
  // Solo se animan las tarjetas cuando el usuario cambia de filtro (no al cargar la página).
  const [filtered, setFiltered] = useState(false);

  // Si se llega a la tienda navegando dentro de la web (p. ej. desde el menú "Menu"),
  // las tarjetas también entran animadas, igual que al pulsar un filtro aquí. En la carga
  // inicial de la página no (el aviso "app lista" lo pone RevealImages después).
  useLayoutEffect(() => {
    // Se decide tras montar (no en el estado inicial) para no romper la hidratación.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if ((window as Window & { __tmAppReady?: boolean }).__tmAppReady) setFiltered(true);
  }, []);

  // Si cambia la categoría por navegación (de /store/mugs a /store/prints desde el
  // menú), se actualiza el filtro y se anima.
  const [prevInitial, setPrevInitial] = useState(initialCategory);
  if (prevInitial !== initialCategory) {
    setPrevInitial(initialCategory);
    setActive(initialCategory);
    setFiltered(true);
  }

  useEffect(() => {
    const onPop = () => {
      const m = window.location.pathname.match(/^\/store\/([^/]+)/);
      setActive(m ? decodeURIComponent(m[1]) : null);
      setFiltered(true);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function select(slug: string | null) {
    setActive(slug);
    setFiltered(true);
    window.history.pushState(null, "", slug ? `/store/${slug}` : "/store");
  }

  const visible = active ? products.filter((p) => p.categories.some((c) => c.slug === active)) : products;

  const item = (label: string, slug: string | null) => (
    <button
      key={slug ?? "all"}
      type="button"
      onClick={() => select(slug)}
      aria-pressed={active === slug}
      className={`whitespace-nowrap py-2 transition-colors lg:px-2 ${active === slug ? "text-foreground" : "text-muted hover:text-foreground"} duration-300`}
    >
      {label}
    </button>
  );

  return (
    <>
      {/* Filtro: activo en negro y el resto en gris. Escritorio: 50px entre botones (web
          real). Móvil: una sola línea, repartidos a lo ancho (el hueco se adapta). */}
      <nav className="reveal mb-[55px] flex justify-between lg:justify-center lg:gap-x-[50px]">
        {item("All", null)}
        {categories.map((c) => item(c.name, c.slug))}
      </nav>
      {/* Al cambiar de filtro la rejilla se vuelve a montar y las tarjetas entran subiendo
          con un fundido, una detrás de otra (como en palomawool.com) */}
      <ProductGrid key={active ?? "all"} products={visible} variant="store" animate={filtered} />
    </>
  );
}
