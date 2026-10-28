import type { WCProduct } from "@/lib/woocommerce/types";
import { HScroll } from "./HScroll";
import { ProductCard } from "./ProductCard";

type Variant = "default" | "wide" | "wideScroll" | "related" | "featured" | "store";

const GRID_CLASS: Record<Variant, string> = {
  default: "grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4",
  // Grid de las colecciones de la home: 3 columnas con los huecos grandes del sitio original.
  // "You may also like" de la ficha: 4 columnas con 15px de hueco en escritorio y, en
  // móvil, un carrusel horizontal recortado en los márgenes (como en la web real).
  related:
    "flex gap-[15px] overflow-x-auto [scrollbar-width:none] [&>*]:w-[65%] [&>*]:shrink-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:[&>*]:w-auto",
  // "Featured" de la home: 5 columnas con 15px de hueco en escritorio; en móvil/tablet,
  // fila horizontal recortada en los márgenes, como el resto de bloques.
  featured:
    "flex gap-[15px] overflow-x-auto [scrollbar-width:none] [&>*]:w-[62%] [&>*]:shrink-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:[&>*]:w-auto",
  // Tienda: 3 columnas con los huecos grandes de la web real (medidos en tatsmood.com/store).
  store: "odd-center grid grid-cols-2 gap-x-[15px] gap-y-10 lg:grid-cols-3 lg:gap-x-[14%] lg:gap-y-[145px]",
  // (en móvil/tablet, 2 columnas con 15px de hueco)
  // Igual que "wide" en escritorio; en móvil/tablet, fila horizontal recortada en los
  // márgenes (como "You may also like"). La home la usa en las colecciones con 3 productos.
  wideScroll:
    "flex gap-[15px] overflow-x-auto [scrollbar-width:none] [&>*]:w-[65%] [&>*]:shrink-0 lg:grid lg:grid-cols-3 lg:gap-x-[14%] lg:gap-y-[100px] lg:overflow-visible lg:[&>*]:w-auto",
  wide: "odd-center grid grid-cols-2 gap-x-[15px] gap-y-10 lg:grid-cols-3 lg:gap-x-[14%] lg:gap-y-[100px]",
};

export function ProductGrid({
  products,
  variant = "default",
  animate = false,
}: {
  products: WCProduct[];
  variant?: Variant;
  /** Tarjetas con entrada animada (la tienda al filtrar). */
  animate?: boolean;
}) {
  if (products.length === 0) {
    return (
      <p className="py-12 text-center text-foreground">
        No products found.
      </p>
    );
  }

  const cards = products.map((p, i) => <ProductCard key={p.id} product={p} appearOrder={animate ? i : undefined} />);

  // Las variantes que en móvil son carrusel horizontal bloquean el eje del gesto.
  if (variant === "related" || variant === "featured" || variant === "wideScroll") {
    return <HScroll className={GRID_CLASS[variant]}>{cards}</HScroll>;
  }
  return <div className={GRID_CLASS[variant]}>{cards}</div>;
}

export function ProductGridSkeleton({ count = 4, variant = "default" }: { count?: number; variant?: Variant }) {
  return (
    <div className={GRID_CLASS[variant]}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div className="aspect-[4/5]" />
          <div className="mt-3 h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}
