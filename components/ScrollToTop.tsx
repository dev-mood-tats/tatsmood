"use client";

import { useLayoutEffect } from "react";

// Si la entrada viene de «Atrás/Adelante» del navegador no se toca el scroll (el navegador
// devuelve al usuario a donde estaba).
let lastPopState = 0;
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    lastPopState = performance.now();
  });
}

/**
 * Al entrar en una página (p. ej. una ficha de producto) la deja arriba del todo. Next.js
 * ya lo intenta, pero con la carga en dos tiempos (esqueleto y luego la ficha) a veces la
 * página quedaba un poco desplazada. `id` cambia con cada página (el slug del producto).
 */
export function ScrollToTop({ id }: { id: string }) {
  useLayoutEffect(() => {
    if (performance.now() - lastPopState < 1000) return;
    // Ya arriba: no se toca. En Safari del iPhone, mover el scroll por código mientras la página
    // aún está cargando (y el usuario ya está tocando, p. ej. una talla y «Add to cart») dejaba
    // descolocado todo lo fijo en pantalla: el carrito lateral salía despegado de arriba hasta
    // recargar. Solo se sube si de verdad hace falta.
    if (window.scrollY === 0 && window.scrollX === 0) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [id]);
  return null;
}
