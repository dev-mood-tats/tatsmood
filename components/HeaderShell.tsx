"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Contenedor de la cabecera.
// - Escritorio: transparente, texto blanco con mix-blend-mode "exclusion" (se lee sobre fotos).
// - Móvil/tablet: 55px de alto. Mientras es transparente (arriba del todo), igual que en
//   escritorio: blanco con "exclusion". En cuanto se hace scroll, fondo blanco, texto negro
//   y sin fusión (con fondo blanco la fusión invertiría la página). El cambio es
//   instantáneo: con transición, el fondo blanco a medio aparecer + la fusión daban un flash.
// - Fichas de producto en móvil/tablet: siempre fondo blanco y texto negro (en escritorio,
//   como el resto de páginas).
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const solid = usePathname().startsWith("/product/");

  useEffect(() => {
    // Con un margen (entra a partir de 20px y sale por debajo de 5px) para que el rebote del
    // scroll al llegar arriba del todo no haga parpadear la cabecera.
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled((prev) => (prev ? y > 5 : y > 20));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-scrolled={scrolled}
      data-solid={solid}
      className={`group/header fixed inset-x-0 top-0 z-20 h-[55px] lg:h-16 lg:bg-transparent lg:text-white lg:mix-blend-exclusion ${
        scrolled || solid ? "bg-background text-foreground" : "bg-transparent text-white mix-blend-exclusion"
      }`}
    >
      {children}
    </header>
  );
}
