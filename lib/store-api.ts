import { getWooConfig } from "@/lib/config";
import { decodeEntities, fromMinorUnits } from "@/lib/format";

// Carrito con la Store API oficial de WooCommerce (wp-json/wc/store/v1).
// El carrito de cada visitante se identifica con un "Cart-Token" (cookie httpOnly en Next.js,
// ver lib/cart-session.ts). Al finalizar la compra, ese mismo token se pasa al checkout de
// WooCommerce (/checkout/?session=…), que recupera el carrito tal cual.
// Todas las llamadas salen del servidor de Next.js.

export interface CartItem {
  key: string;
  productId: number;
  name: string;
  slug: string;
  quantity: number;
  maxQuantity: number | null;
  unitPrice: number;
  lineSubtotal: number;
  image: string | null;
  /** Atributos de la variación elegida, p. ej. [{ attribute: "Size", value: "M" }]. */
  variation: { attribute: string; value: string }[];
}

export interface Cart {
  token: string | null;
  itemCount: number;
  currency: string;
  items: CartItem[];
  subtotal: number;
}

export class StoreApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "StoreApiError";
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function slugFromPermalink(permalink: string) {
  try {
    return new URL(permalink).pathname.split("/").filter(Boolean).pop() ?? "";
  } catch {
    return "";
  }
}

function normalizeCart(raw: any, token: string | null): Cart {
  const totals = raw?.totals ?? {};
  const minor = Number(totals.currency_minor_unit ?? 2);
  const money = (value: unknown, unit = minor) => fromMinorUnits(value as string, unit);

  return {
    token,
    itemCount: Number(raw?.items_count ?? 0),
    currency: totals.currency_code ?? "EUR",
    items: (raw?.items ?? []).map((item: any) => {
      const itemMinor = Number(item.prices?.currency_minor_unit ?? minor);
      const max = Number(item.quantity_limits?.maximum);
      return {
        key: String(item.key),
        productId: Number(item.id),
        name: decodeEntities(String(item.name ?? "")),
        slug: slugFromPermalink(String(item.permalink ?? "")),
        quantity: Number(item.quantity ?? 1),
        maxQuantity: Number.isFinite(max) && max > 0 && max < 9999 ? max : null,
        unitPrice: money(item.prices?.price, itemMinor),
        lineSubtotal: money(item.totals?.line_subtotal, itemMinor) + money(item.totals?.line_subtotal_tax, itemMinor),
        image: item.images?.[0]?.src ? String(item.images[0].src) : null,
        variation: (item.variation ?? []).map((v: any) => ({
          attribute: decodeEntities(String(v.attribute ?? "")),
          value: decodeEntities(String(v.value ?? "")),
        })),
      };
    }),
    subtotal: money(totals.total_items) + money(totals.total_items_tax),
  };
}

async function storeFetch(
  path: string,
  { method = "GET", token, body }: { method?: string; token?: string | null; body?: unknown } = {},
): Promise<{ data: any; token: string | null }> {
  const { url } = getWooConfig();
  const res = await fetch(`${url}/wp-json/wc/store/v1${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(token ? { "Cart-Token": token } : {}),
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new StoreApiError(`WooCommerce no ha devuelto JSON (${res.status}) en ${path}.`, res.status);
  }

  if (!res.ok) {
    const message = decodeEntities(String(data?.message ?? `WooCommerce error (${res.status})`).replace(/<[^>]*>/g, ""));
    throw new StoreApiError(message, res.status, data?.code);
  }

  return { data, token: res.headers.get("Cart-Token") ?? token ?? null };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Carrito actual. Sin token, WooCommerce crea uno nuevo (vacío) y devuelve su token. */
export async function fetchCart(token: string | null): Promise<Cart> {
  const { data, token: newToken } = await storeFetch("/cart", { token });
  return normalizeCart(data, newToken);
}

/** Las escrituras necesitan un Cart-Token válido: si no hay, se pide uno primero. */
async function cartWrite(path: string, token: string | null, body: unknown) {
  const validToken = token ?? (await fetchCart(null)).token;
  if (!validToken) throw new StoreApiError("WooCommerce no ha devuelto un Cart-Token.", 500);
  const { data, token: newToken } = await storeFetch(path, { method: "POST", token: validToken, body });
  return normalizeCart(data, newToken);
}

// `productId` acepta tanto el id de un producto simple como el de una variación
// concreta (talla): para la Store API una variación es un producto más, con su propio id.
export function addItem(token: string | null, productId: number, quantity: number) {
  return cartWrite("/cart/add-item", token, { id: productId, quantity });
}

export function updateItem(token: string, itemKey: string, quantity: number) {
  return cartWrite("/cart/update-item", token, { key: itemKey, quantity });
}

export function removeItem(token: string, itemKey: string) {
  return cartWrite("/cart/remove-item", token, { key: itemKey });
}

export const emptyCart: Cart = { token: null, itemCount: 0, currency: "EUR", items: [], subtotal: 0 };
