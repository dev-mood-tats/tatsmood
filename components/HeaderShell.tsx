"use client";

import { useEffect, useState } from "react";

// Contenedor de la cabecera.
// - Escritorio: transparente, texto blanco con mix-blend-mode "exclusion" (se lee sobre fotos).
// - Móvil/tablet: 55px de alto. Mientras es transparente (arriba del todo), igual que en
//   escritorio: blanco con "exclusion". En cuanto se hace scroll, fondo blanco, texto negro
//   y sin fusión (con fondo blanco la fusión invertiría la página). El cambio es
//   instantáneo: con transición, el fondo blanco a medio aparecer + la fusión daban un flash.
// - Posición «sticky» (no «fixed»): la cabecera es parte de la página, arriba del todo, y se
//   queda pegada al hacer scroll. Con «fixed» flotaba sobre la ventana y, en los navegadores
//   móviles con la barra de direcciones fija (Instagram, Brave, Firefox, Ecosia…), a veces
//   se despegaba y se quedaba a media pantalla. Las páginas con foto de cabecera (home,
//   colecciones, fichas en escritorio) suben su contenido por debajo con un margen negativo
//   del alto de la cabecera (55px / 64px), para que siga viéndose transparente encima.
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
      className={`group/header sticky top-0 z-20 h-[55px] w-full shrink-0 lg:h-16 lg:bg-transparent lg:text-white lg:mix-blend-exclusion ${
        scrolled ? "bg-background text-foreground" : "bg-transparent text-white mix-blend-exclusion"
      }`}
    >
      {children}
    </header>
  );
}
