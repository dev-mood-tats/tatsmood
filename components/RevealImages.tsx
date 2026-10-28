"use client";

import { useEffect } from "react";

// Efectos de entrada al aparecer en pantalla:
// - Imágenes sueltas y bloques de texto marcados con "reveal" / "reveal-children"
//   (app/reveal.css): fundido + desenfoque, como en tatsmood.com.
// Aquí solo se marcan con "in-view" al verlas; los estilos están en app/reveal.css.
// Vigila también lo que aparece después (navegación, streaming, filtros de la tienda).
export function RevealImages() {
  useEffect(() => {
    // Marca que la web ya ha cargado: a partir de aquí, las páginas a las que se llega
    // navegando (p. ej. la tienda desde el menú) saben que no es la carga inicial.
    (window as Window & { __tmAppReady?: boolean }).__tmAppReady = true;

    const SELECTOR = "main img, .reveal, .reveal-children > *";

    // Una foto solo empieza a aparecer cuando ya se ha descargado: si se activara al entrar
    // en pantalla pero aún cargando (p. ej. la primera foto, grande, de una ficha), el
    // fundido terminaría antes de que la foto llegara y esta saldría de golpe.
    const reveal = (el: Element) => {
      if (el instanceof HTMLImageElement && !(el.complete && el.naturalWidth > 0)) {
        const done = () => {
          el.removeEventListener("load", done);
          el.removeEventListener("error", done);
          // Un fotograma después, para que el navegador pinte primero el estado inicial.
          requestAnimationFrame(() => el.classList.add("in-view"));
        };
        el.addEventListener("load", done);
        el.addEventListener("error", done);
        return;
      }
      el.classList.add("in-view");
    };
    const imgObserver = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            reveal(e.target);
            imgObserver.unobserve(e.target);
          }
        }
      },
      { threshold: 0.05 },
    );

    // Solo se tocan elementos que React ya ha hidratado: si se les añade una clase antes
    // (p. ej. contenido que llega en streaming dentro de un <Suspense>), React detecta que
    // el HTML no coincide con lo que esperaba y da un error de hidratación. Los que aún no
    // están hidratados se apuntan y se vuelven a mirar cada 100 ms.
    // El HTML que llega de WordPress (dangerouslySetInnerHTML, p. ej. las páginas legales) no
    // tiene nodos de React propios: cuenta como hidratado cuando lo está su contenedor.
    type Fiber = { memoizedProps?: { dangerouslySetInnerHTML?: unknown } };
    const fiberOf = (el: Element) => {
      const key = Object.keys(el).find((k) => k.startsWith("__reactFiber$"));
      return key ? ((el as unknown as Record<string, Fiber>)[key] ?? null) : null;
    };
    const isHydrated = (el: Element) => {
      if (fiberOf(el)) return true;
      const parent = el.parentElement && fiberOf(el.parentElement);
      return Boolean(parent?.memoizedProps?.dangerouslySetInnerHTML);
    };
    const pending = new Set<Element>();

    const track = (el: Element) => {
      if (el.classList.contains("in-view")) return;
      if (!isHydrated(el)) {
        pending.add(el);
        return;
      }
      imgObserver.observe(el);
    };

    const watch = (root: ParentNode) => {
      root.querySelectorAll?.(SELECTOR).forEach(track);
    };

    watch(document);
    const mo = new MutationObserver((muts) => {
      for (const m of muts)
        m.addedNodes.forEach((n) => {
          if (!(n instanceof Element)) return;
          if (n.matches(SELECTOR)) track(n);
          watch(n);
        });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    const retry = window.setInterval(() => {
      for (const el of pending) {
        if (!el.isConnected) pending.delete(el);
        else if (isHydrated(el)) {
          pending.delete(el);
          track(el);
        }
      }
    }, 100);

    return () => {
      window.clearInterval(retry);
      imgObserver.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
