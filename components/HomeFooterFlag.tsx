"use client";

import { useEffect } from "react";

// Marca <body> mientras el final de la home está en pantalla, para que el footer se
// coloque encima de la foto (app/home.css). Antes se detectaba con body:has(#home-closing),
// pero Next.js guarda la página anterior oculta en el DOM al navegar, así que al entrar a
// un producto desde la home el footer seguía colocado "encima de la foto" y no se veía.
// Con un efecto, la marca se pone al mostrarse la home y se quita en cuanto se oculta o
// se desmonta. (Antes había además un <script> en línea, pero React no lo permite.)
export function HomeFooterFlag() {
  useEffect(() => {
    document.body.dataset.homeClosing = "";
    return () => {
      delete document.body.dataset.homeClosing;
    };
  }, []);

  return null;
}
