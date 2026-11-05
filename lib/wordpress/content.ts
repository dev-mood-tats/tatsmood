import { cacheLife, cacheTag } from "next/cache";
import { getWooConfig } from "@/lib/config";
import { objectPosition } from "@/lib/focal";
import { wpFetch } from "@/lib/wp-fetch";

// Contenidos que Tat edita en WordPress (mu-plugins/tatsmood-content.php), leídos de la
// API pública /wp-json/tatsmood/v1/. Con la misma caché que el catálogo: WordPress avisa
// a /api/revalidate al guardar y la web se actualiza al momento.

/** `focal`: centro de interés en % ([x, y]) que Tat marca en Medios; se usa al recortar. */
export type WPImage = { url: string; width: number; height: number; alt: string; focal: [number, number]; srcset?: string };
/** `link`: ruta de la web (/product/…) o dirección externa a la que lleva la foto; vacío si no enlaza. */
export type LookbookImage = WPImage & { crop: "" | "4:3" | "1:1" | "4:5"; link: string };
export type LookbookRow = { layout: string; tight: boolean; images: LookbookImage[] };

export type Collection = {
  slug: string;
  name: string;
  description: string;
  date: string;
  homeTitle: string;
  homeImage: WPImage | null;
  hero: WPImage | null;
  rows: LookbookRow[];
  /** Ids de los productos publicados de la colección (de más nuevo a más antiguo). */
  products: number[];
};

/** `collections`: slugs de las colecciones de la home, en orden. `featured`: ids de producto, en orden. */
export type HomeSettings = { intro: string; background: WPImage | null; collections: string[]; featured: number[] };
export type FaqGroup = { title: string; items: { question: string; answer: string }[] };
export type WPPage = { title: string; html: string; faqs?: FaqGroup[] };

const REVALIDATE = process.env.NODE_ENV === "production" ? 60 * 60 : 60;
function contentCache() {
  cacheLife({ stale: 300, revalidate: REVALIDATE, expire: 60 * 60 * 24 * 7 });
  cacheTag("content");
}

async function wpGet<T>(path: string): Promise<T | null> {
  const res = await wpFetch(`${getWooConfig().url}/wp-json/tatsmood/v1${path}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`WordPress ${path}: ${res.status}`);
  return (await res.json()) as T;
}

/** Todas las colecciones (etiquetas de producto), ya ordenadas. */
export async function getCollections(): Promise<Collection[]> {
  "use cache";
  contentCache();
  return (await wpGet<Collection[]>("/collections")) ?? [];
}

/** Colecciones con página propia: las que tienen foto de cabecera (o lookbook). */
export async function getCollectionPages(): Promise<Collection[]> {
  return (await getCollections()).filter((c) => c.hero || c.rows.length > 0);
}

export type MenuItem = { label: string; href: string; external: boolean };
/** Menús de WordPress (Apariencia → Menús), con las rutas ya de Next.js. */
export type Menus = { tienda: MenuItem[]; colecciones: MenuItem[]; redes: MenuItem[]; footer: MenuItem[] };
const EMPTY_MENUS: Menus = { tienda: [], colecciones: [], redes: [], footer: [] };

export async function getMenus(): Promise<Menus> {
  "use cache";
  contentCache();
  return { ...EMPTY_MENUS, ...((await wpGet<Partial<Menus>>("/menus")) ?? {}) };
}

/** Para usar fuera de <Suspense>: si WordPress no responde, menús vacíos en vez de error. */
export const getMenusSafe = () => getMenus().catch(() => EMPTY_MENUS);

export async function getHomeSettings(): Promise<HomeSettings> {
  "use cache";
  contentCache();
  return (await wpGet<HomeSettings>("/home")) ?? { intro: "", background: null, collections: [], featured: [] };
}

export async function getPage(slug: string): Promise<WPPage | null> {
  "use cache";
  contentCache();
  return wpGet<WPPage>(`/page/${slug}`);
}

/** «[October, 2026] — texto», como en la web. */
export const withDate = (c: Pick<Collection, "date" | "description">) =>
  c.date ? `[${c.date}] — ${c.description}` : c.description;

/** `object-position` / `background-position` con el centro de interés de la foto. */
export const focalPosition = (img: Pick<WPImage, "focal"> | null | undefined) => objectPosition(img) ?? "50% 50%";

/**
 * `sizes` de una foto que llena una caja con object-cover: se ve tan ancha como la caja
 * o, si la foto es más apaisada que la caja, como su alto × proporción. Así el navegador
 * pide la foto con la resolución que de verdad se ve (si no, en móvil salen borrosas).
 */
export function coverSizes(img: Pick<WPImage, "width" | "height"> | null | undefined, mobile: { vw?: number; px?: number }, desktop: { vh: number; from: number }) {
  const r = img?.width && img?.height ? img.width / img.height : 1.5;
  const mobileWidth = mobile.vw ? `${Math.max(100, Math.ceil(mobile.vw * r))}vw` : `max(100vw, ${Math.ceil((mobile.px ?? 0) * r)}px)`;
  return `(min-width: ${desktop.from}px) max(100vw, ${Math.ceil(desktop.vh * r)}vh), ${mobileWidth}`;
}
