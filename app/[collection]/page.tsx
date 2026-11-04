import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductGrid, ProductGridSkeleton } from "@/components/ProductGrid";
import { CROP_RATIOS, LOOKBOOK_LAYOUTS, LOOKBOOK_ROW_WIDTH, LOOKBOOK_WIDTH_VW } from "@/lib/collections";
import {
  coverSizes,
  focalPosition,
  getCollectionPages,
  withDate,
  type LookbookRow as Row,
} from "@/lib/wordpress/content";
import { getProductsInOrder } from "@/lib/woocommerce/catalog";
import { pageMetadata, plainText } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[collection]">) {
  const { collection: slug } = await params;
  const page = (await getCollectionPages()).find((c) => c.slug === slug);
  if (!page) return {};
  return pageMetadata({ title: page.name, description: plainText(page.description), path: `/${page.slug}`, image: page.hero });
}

// Páginas de colección (/yolo, /gracias…): todo sale de WordPress (Productos → Collections, ver
// mu-plugins/tatsmood-content.php): foto de cabecera, fecha, descripción, lookbook y,
// al final, los productos de la colección.

export async function generateStaticParams() {
  const collections = await getCollectionPages();
  return collections.map((c) => ({ collection: c.slug }));
}

// Foto del lookbook con enlace (a un producto, colección, página o web externa): la
// foto entera es el enlace. Sin enlace, la foto sola.
function LookbookLink({ href, children }: { href: string; children: React.ReactNode }) {
  if (!href) return children;
  const className = "absolute inset-0 block";
  return href.startsWith("/") ? (
    <Link href={href} className={className}>
      {children}
    </Link>
  ) : (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {children}
    </a>
  );
}

// Fila del lookbook: en escritorio las fotos se reparten el ancho del lookbook en columnas
// (alineadas arriba, 15px entre ellas); en móvil, una debajo de otra a todo el ancho.
function LookbookRow({ row, title }: { row: Row; title: string }) {
  const cols = LOOKBOOK_LAYOUTS[row.layout] ?? LOOKBOOK_LAYOUTS.centrada;
  const total = cols.reduce((a, b) => a + b, 0);
  const width = LOOKBOOK_ROW_WIDTH[row.layout] ?? 100; // % del ancho del lookbook
  const images = row.images.slice(0, cols.length);
  return (
    <div
      className="flex flex-col gap-[15px] px-5 lg:mx-auto lg:grid lg:w-[var(--row-w)] lg:items-start lg:px-0 lg:[grid-template-columns:var(--cols)]"
      style={{ "--cols": cols.map((c) => `${c}fr`).join(" "), "--row-w": `${width}%` } as React.CSSProperties}
    >
      {images.map((img, i) => {
        const ratio = CROP_RATIOS[img.crop] ?? img.width / img.height;
        return (
          <div key={`${img.url}-${i}`} className="relative w-full overflow-hidden" style={{ aspectRatio: ratio }}>
            <LookbookLink href={img.link}>
              <Image
                src={img.url}
                alt={img.alt || title}
                fill
                sizes={`(min-width: 1024px) ${Math.ceil((LOOKBOOK_WIDTH_VW * (width / 100) * cols[i]) / total)}vw, 100vw`}
                className="object-cover"
                style={{ objectPosition: focalPosition(img) }}
              />
            </LookbookLink>
          </div>
        );
      })}
    </div>
  );
}

async function CollectionProducts({ ids }: { ids: number[] }) {
  const products = await getProductsInOrder(ids);
  return <ProductGrid products={products} variant="store" />;
}

async function CollectionContent({
  params,
}: {
  params: Promise<{ collection: string }>;
}) {
  const { collection: slug } = await params;
  const page = (await getCollectionPages()).find((c) => c.slug === slug);
  if (!page) notFound();
  const title = page.name;

  return (
    // La cabecera va encima de la foto grande (como en la home y la ficha de producto).
    <div className="-mt-[55px] pb-24 lg:-mt-16">
      {/* Foto grande: medidas de la web real (650px en móvil, 87% de la pantalla en escritorio) */}
      <div className="relative h-[650px] w-full overflow-hidden lg:h-[87vh]">
        {page.hero && (
          <Image
            src={page.hero.url}
            alt={page.hero.alt || title}
            fill
            priority
            // Caja: 650px de alto en móvil, 87vh en escritorio
            sizes={coverSizes(page.hero, { px: 650 }, { vh: 87, from: 1024 })}
            className="no-reveal object-cover"
            style={{ objectPosition: focalPosition(page.hero) }}
          />
        )}
      </div>

      {/* "Home / Colección" a la izquierda y la descripción a la derecha (en móvil, debajo) */}
      <div className="reveal mt-[15px] px-5 lg:flex lg:items-start lg:px-[15px]">
        <div className="lg:w-[48.46%] lg:shrink-0">
          <Link
            href="/"
            className="transition-opacity hover:opacity-60 duration-300"
          >
            Home
          </Link>{" "}
          / <h1 className="inline">{title}</h1>
        </div>
        <p className="mt-[14px] lg:mt-0 lg:flex-1">{withDate(page)}</p>
      </div>

      {/* Lookbook: 100px bajo la descripción en escritorio, 50px entre filas (15px en algunas) */}
      {page.rows.length > 0 && (
        <div className="lookbook mt-4 lg:mt-[100px]">
          {page.rows.map((row, i) => (
            <div
              key={i}
              className={i === 0 ? "" : row.tight ? "mt-[15px]" : "mt-[50px]"}
            >
              <LookbookRow row={row} title={title} />
            </div>
          ))}
        </div>
      )}

      {/* Productos de la colección (sin lookbook, como en Connected: 100px bajo la descripción) */}
      <div
        className={`mt-[100px] px-5 lg:px-[15px] ${page.rows.length > 0 ? "lg:mt-[150px]" : "lg:mt-[100px]"}`}
      >
        <Suspense fallback={<ProductGridSkeleton count={6} variant="store" />}>
          <CollectionProducts ids={page.products} />
        </Suspense>
      </div>
    </div>
  );
}

export default function CollectionPage({
  params,
}: PageProps<"/[collection]">) {
  return (
    <Suspense
      fallback={<div className="-mt-[55px] h-[650px] lg:-mt-16 lg:h-[87vh]" />}
    >
      <CollectionContent params={params} />
    </Suspense>
  );
}
