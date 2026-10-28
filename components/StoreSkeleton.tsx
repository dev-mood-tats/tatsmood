import { ProductGridSkeleton } from "./ProductGrid";

// Hueco del filtro + rejilla mientras carga la tienda (mismas medidas que la tienda
// real, para que no haya saltos al aparecer los productos).
export function StoreSkeleton() {
  return (
    <>
      <div className="mb-[55px] h-[33px]" />
      <ProductGridSkeleton count={6} variant="store" />
    </>
  );
}
