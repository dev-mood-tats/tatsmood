import { getWooConfig } from "@/lib/config";
import type { WCImage } from "./types";

// Campos ACF del grupo "Single product" (group_691a068053282) en Productos:
// imagen_hover, shoot_1..shoot_4, desplegable_1/2 (+ _title). WooCommerce los expone
// en meta_data con el valor en crudo (el id del adjunto para los campos de imagen),
// así que hay que resolverlos aparte contra wp/v2/media.

export interface WCProductAcf {
  hoverImage: WCImage | null;
  gallery: WCImage[];
  /** shoot_1..shoot_4 en su posición (null si el campo está vacío): cada campo tiene su hueco fijo en la ficha. */
  shoots: (WCImage | null)[];
  careTitle: string;
  careHtml: string;
  sizeGuideTitle: string;
  sizeGuideHtml: string;
}

const EMPTY_ACF: WCProductAcf = {
  hoverImage: null,
  gallery: [],
  shoots: [null, null, null, null],
  careTitle: "Fabric and care",
  careHtml: "",
  sizeGuideTitle: "Size guide",
  sizeGuideHtml: "",
};

interface RawMeta {
  key: string;
  value: unknown;
}
interface RawProduct {
  id: number;
  meta_data?: RawMeta[];
}

function metaMap(raw: RawProduct): Record<string, string> {
  const map: Record<string, string> = {};
  for (const m of raw.meta_data ?? []) {
    if (typeof m.value === "string") map[m.key] = m.value;
  }
  return map;
}

export async function fetchMediaMap(ids: number[]): Promise<Record<number, WCImage>> {
  const unique = Array.from(new Set(ids.filter((id) => Number.isInteger(id) && id > 0)));
  if (unique.length === 0) return {};
  const { url } = getWooConfig();
  const res = await fetch(
    `${url}/wp-json/wp/v2/media?include=${unique.join(",")}&per_page=100&_fields=id,source_url,alt_text,title,media_details,tatsmood_focal`,
    { cache: "no-store" },
  );
  if (!res.ok) return {};
  const media = (await res.json()) as {
    id: number;
    source_url: string;
    alt_text: string;
    title?: { rendered?: string };
    media_details?: { width?: number; height?: number };
    tatsmood_focal?: [number, number];
  }[];
  const map: Record<number, WCImage> = {};
  for (const m of media) {
    map[m.id] = {
      id: m.id,
      src: m.source_url,
      name: m.title?.rendered ?? "",
      alt: m.alt_text ?? "",
      width: m.media_details?.width,
      height: m.media_details?.height,
      focal: m.tatsmood_focal,
    };
  }
  return map;
}

export async function resolveAcfForProducts(raws: RawProduct[]): Promise<Record<number, WCProductAcf>> {
  const metas = raws.map((r) => ({ id: r.id, meta: metaMap(r) }));
  const allIds: number[] = [];
  for (const { meta } of metas) {
    for (const key of ["imagen_hover", "shoot_1", "shoot_2", "shoot_3", "shoot_4"]) {
      const v = Number(meta[key]);
      if (v) allIds.push(v);
    }
  }
  const mediaMap = await fetchMediaMap(allIds);

  const out: Record<number, WCProductAcf> = {};
  for (const { id, meta } of metas) {
    const hoverId = Number(meta.imagen_hover);
    const gallery = (["shoot_1", "shoot_2", "shoot_3", "shoot_4"] as const)
      .map((k) => Number(meta[k]))
      .filter((v) => v > 0)
      .map((v) => mediaMap[v])
      .filter((v): v is WCImage => !!v);

    const shoots = (["shoot_1", "shoot_2", "shoot_3", "shoot_4"] as const).map((k) => {
      const v = Number(meta[k]);
      return v > 0 ? (mediaMap[v] ?? null) : null;
    });

    out[id] = {
      shoots,
      hoverImage: hoverId ? (mediaMap[hoverId] ?? null) : null,
      gallery,
      careTitle: meta.desplegable_1_title || EMPTY_ACF.careTitle,
      careHtml: meta.desplegable_1 || "",
      sizeGuideTitle: meta.desplegable_2_title || EMPTY_ACF.sizeGuideTitle,
      sizeGuideHtml: meta.desplegable_2 || "",
    };
  }
  return out;
}

/** Añade ancho y alto originales a las fotos de la galería (WooCommerce no los da). */
export async function withImageSizes(images: WCImage[]): Promise<WCImage[]> {
  const media = await fetchMediaMap(images.map((img) => img.id)).catch(() => ({}) as Record<number, WCImage>);
  return images.map((img) => {
    const m = media[img.id];
    return m?.width && m?.height ? { ...img, width: m.width, height: m.height, focal: m.focal ?? img.focal } : img;
  });
}

