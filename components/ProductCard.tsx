"use client";

import { WPImage, smallestImageSrc } from "@/components/WPImage";
import Link from "next/link";
import { useRef, useState } from "react";
import { addToCart } from "@/lib/cart-store";
import { objectPosition } from "@/lib/focal";
import type { WCProduct, WCVariation } from "@/lib/woocommerce/types";
import { Price } from "./Price";

/**
 * `appearOrder`: si viene, la tarjeta entra subiendo con un fundido (escalonada según el
 * número). Solo lo usa la tienda al cambiar de filtro.
 */
export function ProductCard({ product, appearOrder }: { product: WCProduct; appearOrder?: number }) {
  const [variations, setVariations] = useState<WCVariation[] | null>(null);

  const image = product.images[0];
  const hoverImage = product.acf.hoverImage; // ACF: imagen_hover
  const soldOut = product.stock_status === "outofstock";
  const isVariable = product.type === "variable";
  // Atributo que define las variaciones (talla, idioma, color…): sea cual sea, sus
  // opciones salen como pastillas al pasar el ratón. Los productos simples enseñan
  // una única pastilla "ADD TO CART", igual que en la web real.
  const sizeAttribute = product.attributes.find((a) => a.variation);
  const canQuickAddVariation = isVariable && !!sizeAttribute && sizeAttribute.options.length > 0 && !soldOut;
  const canQuickAddSimple = product.type === "simple" && product.purchasable && !soldOut;
  const canQuickAdd = canQuickAddVariation || canQuickAddSimple;

  // Las variaciones (para saber qué id añadir y qué tallas están agotadas) se piden al
  // pasar el ratón; si se pulsa una talla antes de que lleguen, se espera a ellas.
  // Mientras tanto los botones se ven normales (antes salían en gris medio segundo).
  const variationsRequest = useRef<Promise<WCVariation[]> | null>(null);

  function loadVariations() {
    if (!variationsRequest.current) {
      variationsRequest.current = fetch(`/api/products/${product.id}/variations`)
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => [])
        .then((data: WCVariation[]) => {
          setVariations(data);
          return data;
        });
    }
    return variationsRequest.current;
  }

  function handleMouseEnter() {
    if (canQuickAddVariation) loadVariations();
  }

  const baseOptimistic = {
    name: product.name,
    slug: product.slug,
    image: smallestImageSrc(product.images[0]),
  };

  // Al pulsar se añade al momento (optimista) y WooCommerce lo confirma detrás.
  function handleSimpleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addToCart({ ...baseOptimistic, productId: product.id, unitPrice: Number(product.price) || 0, variation: [] });
  }

  async function handleSizeClick(e: React.MouseEvent, option: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!sizeAttribute) return;
    // Normalmente ya están cargadas desde el hover; si no, se esperan (es una petición corta).
    const list = variations ?? (await loadVariations());
    const variation = list.find((v) =>
      v.attributes.some((a) => a.name === sizeAttribute.name && a.option.toLowerCase() === option.toLowerCase()),
    );
    if (!variation || variation.stock_status === "outofstock") return;
    addToCart({
      ...baseOptimistic,
      productId: variation.id,
      unitPrice: Number(variation.price) || Number(product.price) || 0,
      variation: [{ attribute: sizeAttribute.name, value: option }],
    });
  }

  return (
    // Solo la foto enlaza a la ficha; el nombre, el precio y las tallas de compra rápida no.
    <div className={`product-card group block ${appearOrder !== undefined ? "card-appear" : ""}`}
      style={appearOrder !== undefined ? ({ "--appear-order": Math.min(appearOrder, 8) } as React.CSSProperties) : undefined} onMouseEnter={handleMouseEnter}>
      <Link href={`/product/${product.slug}`} className="relative block aspect-[4/5] overflow-hidden" aria-label={product.name}>
        {image ? (
          <>
            <WPImage
              src={image.src}
              srcSet={image.srcset}
              alt={image.alt || product.name}
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover"
              style={{ objectPosition: objectPosition(image) }}
            />
            {/* Foto de hover encima de la principal, con un fundido suave solo en ella: la
                principal se queda opaca debajo, así no se transparentan las dos a la vez. */}
            {hoverImage && (
              <WPImage
                src={hoverImage.src}
                srcSet={hoverImage.srcset}
                alt={hoverImage.alt || product.name}
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="card-hover-img absolute inset-0 object-cover opacity-0 lg:group-hover:opacity-100"
                style={{ objectPosition: objectPosition(hoverImage) }}
              />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-foreground">No image</div>
        )}
        {soldOut && <span className="absolute left-2 top-2 bg-foreground px-2 py-1 text-background">Sold out</span>}
        {!soldOut && product.on_sale && (
          <span className="absolute left-2 top-2 bg-accent px-2 py-1 text-white">Sale</span>
        )}
      </Link>

      {/* En escritorio, 13px más de zona de hover por debajo (y el mismo margen negativo, para
          no mover la rejilla): los botones de talla (27px desde 3px) sobresalen de la línea de
          título (17px) y, sin esto, al bajar el ratón sobre ellos se salía del hover. */}
      <div className="relative mt-3 lg:-mb-[13px] lg:pb-[13px]">
        <div className={`flex flex-col lg:flex-row lg:items-baseline lg:justify-between lg:gap-2 ${canQuickAdd ? "lg:group-hover:invisible" : ""}`}>
          <h3 translate="no">{product.name}</h3>
          <Price product={product} />
        </div>

        {canQuickAdd && (
          <div
            className="absolute inset-x-0 top-[3px] hidden justify-center gap-[4px] lg:group-hover:flex"
            onClick={(e) => e.preventDefault()}
          >
            {canQuickAddSimple && (
              <button
                type="button"
                onClick={handleSimpleAdd}
                className="min-w-[35px] bg-surface px-[10px] py-[5px] text-foreground transition-colors hover:bg-foreground hover:text-background duration-300"
              >
                ADD TO CART
              </button>
            )}
            {canQuickAddVariation &&
              sizeAttribute.options.map((option) => {
              const variation = variations?.find((v) =>
                v.attributes.some((a) => a.name === sizeAttribute.name && a.option.toLowerCase() === option.toLowerCase()),
              );
              const unavailable = variations !== null && (!variation || variation.stock_status === "outofstock");
              return (
                <button
                  key={option}
                  type="button"
                  translate="no"
                  disabled={unavailable}
                  onClick={(e) => handleSizeClick(e, option)}
                  className="min-w-[35px] bg-surface px-[10px] py-[5px] text-foreground transition-colors hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:text-[#b5b5b5] disabled:line-through disabled:hover:bg-surface duration-300"
                >
                  {option}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
