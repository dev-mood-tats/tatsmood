"use client";

import { useEffect, useState } from "react";

// Contenedor de la cabecera.
// - Escritorio: transparente, texto blanco con mix-blend-mode "exclusion" (se lee sobre fotos).
// - Móvil/tablet: 55px de alto. Mientras es transparente (arriba del todo), igual que en
//   escritorio: blanco con "exclusion". En cuanto se hace scroll, fondo blanco, texto negro
//   y sin fusión (con fondo blanco la fusión invertiría la página). El cambio es
//   instantáneo: con transición, el fondo blanco a medio aparecer + la fusión daban un flash.
// - translateZ(0): en los navegadores dentro de apps (Instagram, sobre todo en iPhone), al
//   navegar con la barra del navegador plegada, una cabecera "fixed" se quedaba a veces
//   flotando a media pantalla. En su propia capa, el navegador la vuelve a colocar bien.
// - Fichas de producto en móvil/tablet: siempre fondo blanco y texto negro (en escritorio,
//   como el resto de páginas). Lo hace el CSS (globals.css, «data-solid-header»): leer la
//   ruta con usePathname() aquí, fuera de <Suspense>, rompía la regeneración de las fichas.
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

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
      className={`group/header fixed inset-x-0 top-0 z-20 h-[55px] [transform:translateZ(0)] lg:h-16 lg:bg-transparent lg:text-white lg:mix-blend-exclusion ${
        scrolled ? "bg-background text-foreground" : "bg-transparent text-white mix-blend-exclusion"
      }`}
    >
      {children}
    </header>
  );
}
