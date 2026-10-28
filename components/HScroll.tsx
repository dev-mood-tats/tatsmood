"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Contenedor con scroll horizontal (carruseles de móvil/tablet) que bloquea el eje en
 * cada gesto del trackpad / Magic Mouse: si el gesto empieza en vertical, la página baja
 * y las tarjetas no se mueven de lado; si empieza en horizontal, solo se mueven las
 * tarjetas. En pantallas táctiles el navegador ya hace esto por sí mismo.
 */
export function HScroll({
  className,
  children,
  indicator,
}: {
  className?: string;
  children: React.ReactNode;
  /** Clases de la barra de scroll que se pinta debajo (p. ej. "mx-5 lg:hidden"). Sin ella, no hay barra. */
  indicator?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Barra de scroll propia: qué parte del carrusel se ve (ancho) y dónde (posición), en %.
  const [bar, setBar] = useState({ size: 100, offset: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el || indicator === undefined) return;
    const update = () => {
      const size = el.scrollWidth > 0 ? Math.min(100, (el.clientWidth / el.scrollWidth) * 100) : 100;
      const max = el.scrollWidth - el.clientWidth;
      setBar({ size, offset: max > 0 ? (el.scrollLeft / max) * (100 - size) : 0 });
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    Array.from(el.children).forEach((c) => ro.observe(c));
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [indicator]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let axis: "x" | "y" | null = null;
    let last = 0;

    const onWheel = (e: WheelEvent) => {
      // Solo cuando de verdad hay contenido desbordado (en escritorio no lo hay).
      if (el.scrollWidth <= el.clientWidth + 1) return;
      const now = performance.now();
      const ax = Math.abs(e.deltaX);
      const ay = Math.abs(e.deltaY);
      if (now - last > 200) axis = ax > ay ? "x" : "y";
      // La inercia de un gesto horizontal sigue mandando eventos casi sin deltaY durante
      // un rato; si mientras tanto empieza un gesto claramente en el otro eje, se cambia
      // de eje en vez de ignorarlo (antes el scroll vertical se "tragaba").
      else if (axis === "x" && ay > 4 && ay > ax * 2) axis = "y";
      else if (axis === "y" && ax > 4 && ax > ay * 2) axis = "x";
      last = now;

      e.preventDefault();
      if (axis === "x") el.scrollLeft += e.deltaX;
      else window.scrollBy(0, e.deltaY);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const scroller = (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
  if (indicator === undefined) return scroller;
  return (
    <>
      {scroller}
      {bar.size < 100 && (
        <div aria-hidden className={`relative mt-[8px] h-[2px] bg-line ${indicator}`}>
          <div className="absolute inset-y-0 bg-foreground" style={{ width: `${bar.size}%`, left: `${bar.offset}%` }} />
        </div>
      )}
    </>
  );
}
