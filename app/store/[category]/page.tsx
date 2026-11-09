import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StoreBrowser } from "@/components/StoreBrowser";
import { getCategories, getProducts } from "@/lib/woocommerce/catalog";
import { StoreSkeleton } from "@/components/StoreSkeleton";
import { sortTypes, typeLabel } from "@/lib/navigation";
import { pageMetadata, plainText } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/store/[category]">) {
  const { category } = await params;
  const cat = (await getCategories()).find((c) => c.slug === category);
  if (!cat) return {};
  return pageMetadata({ title: typeLabel(cat), description: plainText(cat.description) || `${typeLabel(cat)} by tatsmood.`, path: `/store/${cat.slug}`, image: cat.image });
}

export async function generateStaticParams() {
  const cats = await getCategories();
  return cats.map((c) => ({ category: c.slug }));
}

// Misma tienda que /store pero con la categoría ya elegida en el filtro (sin título).
async function CategoryStore({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const [products, categories] = await Promise.all([getProducts({ perPage: 100 }), getCategories()]);
  const cat = categories.find((c) => c.slug === category);
  if (!cat) notFound();
  return (
    <>
      {/* Sin título visible (el filtro ya marca la categoría): h1 para buscadores y lectores. */}
      <h1 className="sr-only">{typeLabel(cat)}</h1>
      <StoreBrowser products={products} categories={sortTypes(categories)} initialCategory={category} />
    </>
  );
}

export default function CategoryPage({ params }: PageProps<"/store/[category]">) {
  return (
    <div className="px-5 lg:px-[15px] pb-20 pt-[75px] lg:pt-[clamp(40px,7.5svh,105px)]">
      <Suspense fallback={<StoreSkeleton />}>
        <CategoryStore params={params} />
      </Suspense>
    </div>
  );
}
