import { WPImage } from "@/components/WPImage";
import Link from "next/link";
import { Suspense } from "react";
import { HomeClosing } from "@/components/HomeClosing";
import { ProductGrid, ProductGridSkeleton } from "@/components/ProductGrid";
import { coverSizes, focalPosition, getCollections, getHomeSettings, withDate, type Collection } from "@/lib/wordpress/content";
import { getProductsInOrder } from "@/lib/woocommerce/catalog";
import { pageMetadata, plainText } from "@/lib/seo";

export async function generateMetadata() {
  const [home, collections] = await Promise.all([getHomeSettings(), getCollections()]);
  const first = collections.find((c) => c.slug === home.collections[0]);
  return { ...pageMetadata({ description: plainText(home.intro), path: "/", image: home.background ?? first?.homeImage }), title: { absolute: "tatsmood" } };
}

// Home: todo sale de WordPress («Web tatsmood»): qué colecciones salen y en qué orden, los
// productos de Featured (en orden) y el final de la home. La foto y el título de cada
// bloque de colección se editan en la colección (Productos → Collections).

async function CollectionSection({ collection, first }: { collection: Collection; first: boolean }) {
  const image = collection.homeImage;
  const title = collection.homeTitle || collection.name;
  const products = await getProductsInOrder(collection.products.slice(0, 12));
  if (products.length === 0) return null;
  return (
    <section className="mb-[100px] sm:mb-[150px]">
      <Link
        href={`/${collection.slug}`}
        className="relative block h-[165vw] w-full overflow-hidden sm:h-[85vh]"
      >
        {image && (
          <WPImage
            src={image.url}
            srcSet={image.srcset}
            alt={image.alt || title}
            // Caja: 165vw de alto en móvil, 85vh desde 640px
            sizes={coverSizes(image, { vw: 165 }, { vh: 85, from: 640 })}
            className="no-reveal object-cover"
            style={{ objectPosition: focalPosition(image) }}
            priority={first}
          />
        )}
      </Link>
      <div className="mt-4 px-5 lg:px-[15px]">
        <div className="reveal grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4">
          <h2 translate="no">{title}</h2>
          <p className="text-foreground">{withDate(collection)}</p>
        </div>
        <div className="mt-10 sm:mt-16">
          {/* Con solo 3 productos, en móvil va en fila horizontal en vez de rejilla de 2 */}
          <ProductGrid products={products} variant={products.length === 3 ? "wideScroll" : "wide"} />
        </div>
      </div>
    </section>
  );
}

// Bloque "Featured": los productos elegidos en «Web tatsmood», en su orden.
async function FeaturedProducts() {
  const { featured } = await getHomeSettings();
  if (featured.length === 0) return null;
  const products = await getProductsInOrder(featured);
  return <ProductGrid products={products} variant="featured" />;
}

async function HomeCollections() {
  const [all, { collections: order }] = await Promise.all([getCollections(), getHomeSettings()]);
  const collections = order.map((slug) => all.find((c) => c.slug === slug)).filter((c): c is Collection => !!c);
  return collections.map((collection, i) => (
    <Suspense
      key={collection.slug}
      fallback={
        <section className="mb-[100px] sm:mb-[150px]">
          <div className="h-[165vw] w-full sm:h-[85vh]" />
          <div className="mt-10 px-5 lg:px-[15px] sm:mt-16">
            <ProductGridSkeleton variant="wide" />
          </div>
        </section>
      }
    >
      <CollectionSection collection={collection} first={i === 0} />
    </Suspense>
  ));
}

export default function HomePage() {
  return (
    <div className="-mt-[55px] lg:-mt-16">
      {/* La home no tiene título visible: h1 solo para buscadores y lectores de pantalla. */}
      <h1 className="sr-only">tatsmood – graphic design brand from Valencia</h1>
      <Suspense fallback={<div className="h-[165vw] sm:h-[85vh]" />}>
        <HomeCollections />
      </Suspense>

      {/* Medidas de la web real: título, 15px, rejilla de 5 y "Shop all" centrado */}
      <section className="px-5 lg:px-[15px]">
        <h2 className="reveal mb-[15px]">Featured</h2>
        <Suspense fallback={<ProductGridSkeleton count={5} variant="featured" />}>
          <FeaturedProducts />
        </Suspense>
        <div className="reveal pb-[149px] pt-[144px] text-center">
          <Link href="/store" className="underline underline-offset-2 transition-opacity hover:opacity-60 duration-300">
            Shop all
          </Link>
        </div>
      </section>

      <Suspense fallback={<div className="h-screen" />}>
        <HomeClosing />
      </Suspense>
    </div>
  );
}
