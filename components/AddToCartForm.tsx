"use client";

import { useMemo, useState } from "react";
import { addToCart } from "@/lib/cart-store";
import type { WCProduct, WCVariation } from "@/lib/woocommerce/types";

export function AddToCartForm({
  product,
  variations,
}: {
  product: WCProduct;
  variations: WCVariation[];
}) {
  // Un producto variable puede tener uno o varios atributos que lo definen
  // (talla, idioma, color…), marcados por WooCommerce con `variation: true`.
  const isVariable = product.type === "variable";
  const variantAttributes = useMemo(
    () => product.attributes.filter((a) => a.variation),
    [product.attributes],
  );

  // Las opciones empiezan sin elegir. Mientras falte alguna, el botón "Add to cart" sale
  // con menos opacidad y no se puede pulsar.
  const [selected, setSelected] = useState<Record<string, string>>({});

  const matchedVariation = useMemo(() => {
    if (!isVariable || variantAttributes.length === 0) return null;
    const allSelected = variantAttributes.every((attr) => selected[attr.name]);
    if (!allSelected) return null;
    return (
      variations.find((v) =>
        variantAttributes.every((attr) =>
          v.attributes.some(
            (va) => va.name === attr.name && va.option.toLowerCase() === selected[attr.name].toLowerCase(),
          ),
        ),
      ) ?? null
    );
  }, [variations, isVariable, variantAttributes, selected]);

  const productId = isVariable ? matchedVariation?.id ?? null : product.id;
  const needsSelection = isVariable && !productId;
  const soldOut =
    product.stock_status === "outofstock" ||
    !product.purchasable ||
    (matchedVariation ? matchedVariation.stock_status === "outofstock" : false);

  // Se añade al momento (el carrito lateral se abre ya con el producto) y WooCommerce
  // lo confirma en segundo plano.
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (needsSelection || !productId) return;
    addToCart({
      productId,
      name: product.name,
      slug: product.slug,
      image: product.images[0]?.src ?? null,
      unitPrice: Number(matchedVariation?.price ?? product.price) || 0,
      variation: variantAttributes.map((attr) => ({ attribute: attr.name, value: selected[attr.name] })),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5">
      {variantAttributes.map((attr) => (
        <div key={attr.id}>
          <div className="grid auto-cols-fr grid-flow-col gap-2.5">
            {attr.options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSelected((prev) => ({ ...prev, [attr.name]: option }))}
                className={`h-7 px-3 transition-colors ${
                  selected[attr.name] === option
                    ? "bg-foreground text-background"
                    : "bg-surface text-foreground hover:bg-foreground hover:text-background"
                } duration-300`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ))}

      <button
        type="submit"
        disabled={soldOut || needsSelection}
        className="h-7 w-full bg-surface px-6 uppercase text-foreground transition-colors hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-surface disabled:hover:text-foreground duration-300"
      >
        {soldOut ? "Sold out" : "Add to cart"}
      </button>
    </form>
  );
}
