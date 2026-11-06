/* eslint-disable @next/next/no-img-element -- a propósito: las fotos se sirven tal cual. */
import type { CSSProperties } from "react";

/**
 * Foto de WordPress servida tal cual, sin pasar por el optimizador de Next.js.
 * WordPress ya guarda cada foto en WebP al 90 % y en varios tamaños (mu-plugin
 * tatsmood-images.php) y nos da la lista (`srcSet`); con `sizes`, el navegador elige el
 * tamaño justo para cada pantalla. Así la web no redimensiona nada: menos memoria y CPU
 * en el hosting, y las fotos no se vuelven a generar con cada despliegue.
 *
 * Por defecto ocupa toda la caja de su contenedor (como `fill` de next/image), que debe
 * tener `position: relative` y tamaño propio.
 */
export function WPImage({
  src,
  srcSet,
  sizes,
  alt,
  className,
  style,
  priority = false,
}: {
  src: string;
  srcSet?: string | null;
  sizes?: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  /** Foto visible al cargar la página (cabeceras, primera foto): se pide la primera. */
  priority?: boolean;
}) {
  return (
    <img
      src={largestFromSrcSet(srcSet) ?? src}
      srcSet={srcSet || undefined}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className={className}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", ...style }}
    />
  );
}

/**
 * La versión más grande de la lista (la última del srcset). Se usa como `src` para que,
 * si un navegador no entiende srcset, tampoco descargue la original de Medios, que puede
 * pesar mucho: WordPress solo pone en la lista los tamaños de 900 KB o menos.
 */
function largestFromSrcSet(srcSet?: string | null): string | null {
  const last = srcSet?.split(",").pop()?.trim().split(/\s+/)[0];
  return last || null;
}

/**
 * La versión más pequeña de una foto (la primera del srcset, 600 px), para miniaturas
 * como la del carrito: así no se descarga una foto grande para enseñarla en pequeño.
 */
export function smallestImageSrc(img?: { src: string; srcset?: string | null } | null): string | null {
  if (!img) return null;
  const first = img.srcset?.split(",")[0]?.trim().split(/\s+/)[0];
  return first || img.src;
}
