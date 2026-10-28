import { getWooConfig } from "@/lib/config";
import { buildQueryString, signOAuthParams } from "./oauth";

export class WooCommerceError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "WooCommerceError";
  }
}

type Query = Record<string, string | number | boolean | undefined>;

interface WooRequest {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  query?: Query;
  body?: unknown;
}

function cleanQuery(query: Query = {}): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== "") out[k] = String(v);
  }
  return out;
}

/**
 * Petición autenticada a la API REST de WooCommerce (wp-json/wc/v3).
 * - HTTPS: autenticación Basic.
 * - HTTP (LocalWP): firma OAuth 1.0a, que es lo que WooCommerce exige sin SSL.
 */
export async function wooFetch<T>(path: string, { method = "GET", query, body }: WooRequest = {}): Promise<T> {
  // Sin connection() aquí: el catálogo se llama desde funciones con "use cache"
  // (lib/woocommerce/catalog.ts), donde no se permite. Las llamadas sin caché (pedidos,
  // ajustes) hacen ellas mismas connection() antes de llamar a wooFetch.
  const { url, consumerKey, consumerSecret } = getWooConfig();
  const endpoint = `${url}/wp-json/wc/v3${path}`;
  const params = cleanQuery(query);
  const headers: Record<string, string> = { Accept: "application/json" };

  let finalParams = params;
  if (endpoint.startsWith("https://")) {
    headers.Authorization = `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`;
  } else {
    finalParams = signOAuthParams(method, endpoint, params, consumerKey, consumerSecret);
  }

  if (body !== undefined) headers["Content-Type"] = "application/json";

  const qs = buildQueryString(finalParams);
  const res = await fetch(qs ? `${endpoint}?${qs}` : endpoint, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new WooCommerceError(
      `WooCommerce no ha devuelto JSON (${res.status}) en ${path}. ¿Está arrancado el sitio en LocalWP y los enlaces permanentes en "Nombre de la entrada"?`,
      res.status,
    );
  }

  if (!res.ok) {
    const err = data as { message?: string; code?: string } | null;
    throw new WooCommerceError(
      `WooCommerce ${res.status} en ${path}: ${err?.message ?? "error desconocido"}`,
      res.status,
      err?.code,
    );
  }

  return data as T;
}
