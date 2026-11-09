import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddToCartForm } from "@/components/AddToCartForm";
import { Price } from "@/components/Price";
import { ProductAccordion } from "@/components/ProductAccordion";
import { ProductMainImages, ProductShootImages } from "@/components/ProductGallery";
import { ProductGrid } from "@/components/ProductGrid";
import { ProductPageSkeleton } from "@/components/ProductPageSkeleton";
import { ScrollToTop } from "@/components/ScrollToTop";
import { getAllProductSlugs, getProductBySlug, getProductVariations, getProducts } from "@/lib/woocommerce/catalog";
import { sortProductsByType } from "@/lib/navigation";
import { pageMetadata, plainText, siteUrl } from "@/lib/seo";

/** Descripción para Google: la corta, la larga o, si el producto no tiene ninguna, una a
 *  partir del nombre y la categoría («Swag T-shirt. T-shirts by tatsmood, …»). */
function productDescription(product: { name: string; short_description: string; description: string; categories: { name: string }[] }) {
  const text = plainText(product.short_description || product.description);
  if (text) return text;
  const category = product.categories[0]?.name;
  return `${product.name}.${category ? ` ${category} by tatsmood,` : " By tatsmood,"} graphic design brand founded and based in Valencia, Spain.`;
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return pageMetadata({
    title: product.name,
    description: productDescription(product),
    path: `/product/${product.slug}`,
    image: product.images[0],
  });
}

/** Datos estructurados de producto (Google: precio, disponibilidad y fotos en los resultados). */
function ProductJsonLd({ product }: { product: NonNullable<Awaited<ReturnType<typeof getProductBySlug>>> }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: plainText(product.short_description || product.description, 500) || productDescription(product),
    image: product.images.map((i) => i.src),
    sku: product.sku || undefined,
    brand: { "@type": "Brand", name: "tatsmood" },
    offers: {
      "@type": "Offer",
      url: `${siteUrl()}/product/${product.slug}`,
      priceCurrency: "EUR",
      price: product.price,
      availability: product.stock_status === "outofstock" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

// Todas las fichas se generan al hacer el build, así se sirven ya montadas y los enlaces
// de las tarjetas las precargan al aparecer en pantalla. Un producto nuevo creado después
// se genera en su primera visita y queda guardado.
export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

/**
 * «You may also like»: siempre 4 productos (si hay). Primero los de la misma categoría
 * (p. ej. las otras tazas en una taza), luego los relacionados de WooCommerce y, si aún no
 * llegan a 4, se completan con el resto del catálogo (por tipo: ropa primero).
 */
async function RelatedProducts({ productId, categoryId, ids }: { productId: number; categoryId?: number; ids: number[] }) {
  const [sameCategory, related, catalog] = await Promise.all([
    categoryId ? getProducts({ categoryId, perPage: 5 }).catch(() => []) : [],
    ids.length ? getProducts({ include: ids.slice(0, 8), perPage: 8 }).catch(() => []) : [],
    getProducts({ perPage: 100 }).catch(() => []),
  ]);
  const seen = new Set([productId]);
  const products = [...sameCategory, ...related, ...sortProductsByType(catalog)]
    .filter((p) => !seen.has(p.id) && seen.add(p.id))
    .slice(0, 4);
  if (products.length === 0) return null;
  return (
    <section className="mt-24 px-5 lg:px-[15px] lg:mt-[180px]">
      <h2 className="reveal mb-6">You may also like</h2>
      <ProductGrid products={products} variant="related" />
    </section>
  );
}

async function ProductContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const variations = product.type === "variable" ? await getProductVariations(product.id) : [];
  // La destacada (foto de estudio) es la de los grids; en la ficha la web real enseña
  // solo las de la galería. Si no hay galería, se usa la destacada.
  const mainImages = product.images.length > 1 ? product.images.slice(1) : product.images;

  return (
    <div className="pb-24 lg:-mt-16">
      <ScrollToTop id={product.slug} />
      <ProductJsonLd product={product} />
      <div className="flex flex-col lg:flex-row-reverse">
        <div className="lg:w-2/3">
          <ProductMainImages images={mainImages} name={product.name} />
        </div>

        {/* En escritorio se queda fija y centrada verticalmente mientras las fotos
            (más altas) siguen bajando, hasta que se acaban. Con min-h-screen ya sale centrado
            desde el primer momento, aunque las fotos aún no hayan cargado. */}
        <div className="px-5 lg:px-[15px] pb-8 pt-[30px] lg:min-h-screen lg:w-1/3 lg:self-stretch lg:py-0">
          <div className="reveal lg:sticky lg:top-1/2 lg:w-[25vw] lg:-translate-y-1/2">
            {/* Móvil: nombre a la izquierda y precio a la derecha en la misma fila (web real).
                Escritorio: uno debajo de otro. */}
            <div className="flex items-baseline justify-between gap-4 lg:block">
              <h1 translate="no">{product.name}</h1>
              <Price product={product} className="block shrink-0" />
            </div>

            <div className="mt-4">
              <AddToCartForm
                product={product}
                variations={variations}
              />
            </div>

            {/* Descripción corta de WooCommerce, debajo del botón (como en la web real;
                p. ej. Intentional Calendar o Yolo Skirt). Si está vacía no se pinta. */}
            {product.short_description.replace(/<[^>]*>/g, "").trim() && (
              <div className="wp-content mt-[45px]" dangerouslySetInnerHTML={{ __html: product.short_description }} />
            )}

            <div className="mt-[45px] space-y-6">
              <ProductAccordion title={product.acf.careTitle} html={product.acf.careHtml} defaultOpen />
              <ProductAccordion title={product.acf.sizeGuideTitle} html={product.acf.sizeGuideHtml} />
            </div>
          </div>
        </div>
      </div>

      <ProductShootImages slots={product.acf.shoots} name={product.name} />

      <Suspense fallback={null}>
        <RelatedProducts productId={product.id} categoryId={product.categories[0]?.id} ids={product.related_ids ?? []} />
      </Suspense>
    </div>
  );
}

export default function ProductPage({ params }: PageProps<"/product/[slug]">) {
  return (
    <>
      {/* Marca la página como ficha: en móvil la cabecera va siempre en blanco (globals.css). */}
      <div data-solid-header hidden />
      <Suspense
        fallback={<ProductPageSkeleton />}
      >
        <ProductContent params={params} />
      </Suspense>
    </>
  );
}
