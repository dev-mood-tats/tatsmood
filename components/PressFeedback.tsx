"use client";

import { useEffect } from "react";

/**
 * Destello al pulsar un botón, para que en el móvil se note que el toque ha contado.
 *
 * En móvil no hay hover (Tailwind solo lo aplica con ratón), así que sin esto un toque en
 * «Add to cart», una talla o «+/−» no daba ninguna señal. Se escucha el evento `click`,
 * que el navegador solo lanza con un toque de verdad (no al deslizar el dedo para hacer
 * scroll), y al elemento pulsado se le pone un momento el mismo aspecto que su hover:
 * - botones grises (hover: fondo negro) → destello negro que se desvanece;
 * - enlaces y textos (hover: opacidad 60 %) → bajan de opacidad un instante.
 * Así no hay que marcar cada botón: cualquier botón nuevo con esos estilos ya lo tiene.
 */
const SELECTOR = '[class*="hover:bg-foreground"], [class*="hover:opacity-60"]';

export function PressFeedback() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.(SELECTOR);
      if (!(el instanceof HTMLElement)) return;
      el.classList.remove("is-pressed");
      void el.offsetWidth; // reinicia la animación si se pulsa varias veces seguidas
      el.classList.add("is-pressed");
      el.addEventListener("animationend", () => el.classList.remove("is-pressed"), { once: true });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
