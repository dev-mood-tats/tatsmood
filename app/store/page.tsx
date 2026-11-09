import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductGrid } from "@/components/ProductGrid";
import { StoreSkeleton } from "@/components/StoreSkeleton";
import { StoreBrowser } from "@/components/StoreBrowser";
import { sortTypes } from "@/lib/navigation";
import { getCategories, getProducts } from "@/lib/woocommerce/catalog";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ title: "Store", description: "All tatsmood products: t-shirts, sweatshirts, accessories, mugs and prints.", path: "/store" });

async function Store({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const { search } = await searchParams;

  // Resultados de búsqueda (desde "Search" de la cabecera).
  if (search) {
    const products = await getProducts({ perPage: 48, search });
    return (
      <>
        <p className="mb-[55px] text-center lg:mb-[clamp(25px,4svh,55px)]">Results for &ldquo;{search}&rdquo;</p>
        {products.length === 0 ? <p className="text-center">No products found.</p> : <ProductGrid products={products} variant="store" />}
      </>
    );
  }

  const [products, categories] = await Promise.all([getProducts({ perPage: 100 }), getCategories()]);
  return <StoreBrowser products={products} categories={sortTypes(categories)} />;
}

export default function ShopPage({ searchParams }: PageProps<"/store">) {
  return (
    <div className="px-5 lg:px-[15px] pb-20 pt-[75px] lg:pt-[clamp(40px,7.5svh,105px)]">
      <h1 className="sr-only">Store</h1>
      <Suspense fallback={<StoreSkeleton />}>
        <Store searchParams={searchParams as Promise<{ search?: string }>} />
      </Suspense>
    </div>
  );
}
