import { ProductPageSkeleton } from "@/components/ProductPageSkeleton";

// Se enseña al instante al pulsar una ficha de producto, mientras el servidor prepara
// la página (sin esto, el clic parecía no hacer nada durante un par de segundos).
export default function Loading() {
  return <ProductPageSkeleton />;
}
