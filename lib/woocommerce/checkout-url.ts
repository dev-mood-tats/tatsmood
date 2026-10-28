import { connection } from "next/server";
import { getWooConfig } from "@/lib/config";
import { wooFetch } from "./client";

let cache: { url: string; expires: number } | null = null;

/** URL de la página de checkout de WooCommerce (Ajustes → Avanzado → Página de finalizar compra). */
export async function getCheckoutUrl(): Promise<string> {
  await connection();
  if (cache && cache.expires > Date.now()) return cache.url;

  const { url: wpUrl } = getWooConfig();
  let url = `${wpUrl}/checkout/`;
  try {
    const setting = await wooFetch<{ value: string }>("/settings/advanced/woocommerce_checkout_page_id");
    const pageId = Number(setting.value);
    if (pageId > 0) {
      const res = await fetch(`${wpUrl}/wp-json/wp/v2/pages/${pageId}?_fields=link,status`, { cache: "no-store" });
      const page = res.ok ? ((await res.json()) as { link?: string; status?: string }) : null;
      url = page?.link || `${wpUrl}/?page_id=${pageId}`;
    }
  } catch (e) {
    console.error("[checkout] No se pudo leer la página de checkout de WooCommerce:", e);
  }

  cache = { url, expires: Date.now() + 60 * 60 * 1000 };
  return url;
}
