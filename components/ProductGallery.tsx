import Image from "next/image";
import type { WCImage } from "@/lib/woocommerce/types";
import { objectPosition } from "@/lib/focal";
import { HScroll } from "./HScroll";

// Fotos principales de la ficha: las de la galería de WooCommerce (sin la destacada,
// que es la de estudio que sale en los grids), a toda la anchura de la columna de
// la derecha, una debajo de otra con 15px de separación y con su proporción original
// (unas fotos son 3:4 y otras 4:5, igual que en la web real, sin recortarlas).
export function ProductMainImages({ images, name }: { images: WCImage[]; name: string }) {
  if (images.length === 0) {
    return <div className="flex aspect-[3/4] items-center justify-center text-foreground">No image</div>;
  }
  // Todas las fotos de la galería van en cajas 4:5, la proporción de toda la web (la de
  // las tarjetas de producto). Cada foto llena su caja recortándose (object-cover): así,
  // si alguna vez se sube una foto con otras medidas, no quedan huecos ni saltos.
  return (
    // En móvil, como en la web real, es un carrusel horizontal (una foto por pantalla) que
    // se recorta en los márgenes laterales: la siguiente foto no asoma por la derecha.
    // En escritorio, una debajo de otra.
    <HScroll indicator="mx-5 lg:hidden" className="mx-5 flex gap-[15px] overflow-x-auto [scrollbar-width:none] lg:mx-0 lg:block lg:space-y-[15px] lg:overflow-visible">
      {images.map((img, i) => (
        <div key={`${img.id}-${i}`} className="relative aspect-[4/5] w-full shrink-0 overflow-hidden">
          <Image
            src={img.src}
            alt={img.alt || name}
            fill
            priority={i === 0}
            sizes="(min-width: 1024px) 67vw, 100vw"
            className={`object-cover ${i === 0 ? "reveal-now" : ""}`}
            style={{ objectPosition: objectPosition(img) }}
          />
        </div>
      ))}
    </HScroll>
  );
}

// Fotos de shooting (ACF shoot_1..shoot_4), debajo de todo y a toda la anchura de la
// página, como en la web real. Cada campo tiene su hueco fijo, por parejas:
// shoot_1 / shoot_3 → hueco pequeño, pegado al borde derecho de la columna de info;
// shoot_2 / shoot_4 → hueco grande, al inicio de la columna de fotos.
// Si un campo está vacío, su hueco se queda vacío (no se corre la siguiente foto).
// Todas en cajas 4:5 (proporción de la web), recortadas si la foto tiene otras medidas.
export function ProductShootImages({ slots, name }: { slots: (WCImage | null)[]; name: string }) {
  const pairs: [WCImage | null, WCImage | null][] = [];
  for (let i = 0; i < slots.length; i += 2) {
    const pair: [WCImage | null, WCImage | null] = [slots[i] ?? null, slots[i + 1] ?? null];
    if (pair[0] || pair[1]) pairs.push(pair);
  }
  if (pairs.length === 0) return null;

  return (
    <div className="space-y-[15px] px-5 lg:mt-[166px] lg:px-0">
      {pairs.map(([small, big], i) => (
        <div key={i} className="grid grid-cols-1 items-start gap-[15px] lg:flex lg:gap-0">
          <div className={`lg:flex lg:w-1/3 lg:justify-end lg:pr-[15px] ${small ? "" : "hidden lg:flex"}`}>
            {small && (
              <div className="relative aspect-[4/5] w-full overflow-hidden lg:w-[18.9vw]">
                <Image src={small.src} alt={small.alt || name} fill sizes="(min-width: 1024px) 19vw, 100vw" className="object-cover" style={{ objectPosition: objectPosition(small) }} />
              </div>
            )}
          </div>
          {big && (
            <div className="relative aspect-[4/5] w-full overflow-hidden lg:w-[33.5vw]">
              <Image src={big.src} alt={big.alt || name} fill sizes="(min-width: 1024px) 34vw, 100vw" className="object-cover" style={{ objectPosition: objectPosition(big) }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
