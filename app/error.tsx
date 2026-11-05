"use client";

import { useEffect, useState } from "react";

// Reintentos automáticos recientes, por página (se reinicia al recargar).
const autoRetries = new Map<string, number>();

// Si algo falla al cargar una página (normalmente, WordPress no responde un momento: el
// MySQL compartido de Hostinger a veces rechaza conexiones). Antes de enseñar el aviso se
// reintenta sola una vez, al segundo y medio: casi siempre a la segunda ya carga. Si
// vuelve a fallar, sale el aviso con «Try again».
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  const message = error instanceof Error ? error.message : String(error);
  // Primero en blanco (igual en el servidor y en el navegador, sin errores de hidratación);
  // el efecto decide si reintenta o enseña el aviso.
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    const recent = Date.now() - (autoRetries.get(location.pathname) ?? 0) < 30_000;
    let fallback = 0;
    const t = window.setTimeout(
      () => {
        if (recent) {
          setShowMessage(true);
          return;
        }
        autoRetries.set(location.pathname, Date.now());
        retry();
        // Si a los 4 s esta página de error sigue aquí, el reintento no ha bastado: aviso.
        fallback = window.setTimeout(() => setShowMessage(true), 4000);
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
