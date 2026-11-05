"use client";

import { useEffect, useState } from "react";

// Reintentos automáticos recientes, por página (se reinicia al recargar).
const autoRetries = new Map<string, number>();

// Si algo falla al cargar una página (normalmente, WordPress no responde un momento: el
// MySQL compartido de Hostinger a veces rechaza conexiones). Antes de enseñar el aviso se
// reintenta sola una vez, al segundo y medio: casi siempre a la segunda ya carga. Si
// vuelve a fallar, recarga la página entera (una vez) y solo después sale el aviso.
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  const message = error instanceof Error ? error.message : String(error);
  // Primero en blanco (igual en el servidor y en el navegador, sin errores de hidratación);
  // el efecto decide si reintenta o enseña el aviso.
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    // Recarga completa de la página (una sola vez por página y minuto). Arregla los fallos de
    // la navegación interna, p. ej. durante un despliegue o con la web abierta de una versión
    // anterior. Si ya se ha recargado hace poco, se enseña el aviso.
    const reloadOrShow = () => {
      const key = `tm-reload:${location.pathname}`;
      let last = 0;
      try {
        last = Number(sessionStorage.getItem(key)) || 0;
      } catch {}
      if (Date.now() - last > 60_000) {
        try {
          sessionStorage.setItem(key, String(Date.now()));
        } catch {}
        location.reload();
        return;
      }
      setShowMessage(true);
    };

    const recent = Date.now() - (autoRetries.get(location.pathname) ?? 0) < 30_000;
    let fallback = 0;
    const t = window.setTimeout(
      () => {
        if (recent) {
          reloadOrShow();
          return;
        }
        autoRetries.set(location.pathname, Date.now());
        retry();
        // Si a los 4 s esta página de error sigue aquí, el reintento no ha bastado.
        fallback = window.setTimeout(reloadOrShow, 4000);
      },
      recent ? 0 : 1500,
    );
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(fallback);
    };
  }, [retry]);

  // Mientras se reintenta, página en blanco (sin aviso que parpadee).
  if (!showMessage) return <div className="min-h-[60vh]" />;

  return (
    <div className="mx-auto max-w-2xl px-5 py-24 text-center lg:px-[15px]">
      <p>Something went wrong</p>
      <p className="mt-4">This page could not be loaded. Please try again in a moment.</p>
      {process.env.NODE_ENV === "development" && (
        <pre className="mt-6 overflow-x-auto whitespace-pre-wrap bg-surface p-4 text-left">{message}</pre>
      )}
      <button type="button" onClick={() => retry()} className="mt-8 transition-opacity duration-300 hover:opacity-60">
        Try again
      </button>
    </div>
  );
}
