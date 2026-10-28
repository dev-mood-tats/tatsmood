import { createHmac, randomBytes } from "node:crypto";

// WooCommerce solo acepta autenticación "Basic" (consumer key + secret en la cabecera)
// cuando WordPress va por HTTPS. Por HTTP (como http://tatsmood.local en LocalWP)
// exige OAuth 1.0a "one-legged": cada petición se firma con HMAC-SHA256.
// Implementación según WC_REST_Authentication::check_oauth_signature().

/** Codificación RFC 3986 (la misma que rawurlencode() de PHP). */
export function percentEncode(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

export function buildQueryString(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([k, v]) => `${percentEncode(k)}=${percentEncode(v)}`)
    .join("&");
}

/**
 * Devuelve los parámetros de la petición más los parámetros oauth_* firmados.
 * `baseUrl` es la URL sin query string, p. ej. http://tatsmood.local/wp-json/wc/v3/products
 */
export function signOAuthParams(
  method: string,
  baseUrl: string,
  params: Record<string, string>,
  consumerKey: string,
  consumerSecret: string,
  now: () => number = Date.now,
  nonce: string = randomBytes(16).toString("hex"),
): Record<string, string> {
  const oauthParams: Record<string, string> = {
    ...params,
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA256",
    oauth_timestamp: String(Math.floor(now() / 1000)),
  };

  const normalized = Object.keys(oauthParams)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(oauthParams[k])}`)
    .join("&");

  const stringToSign = [
    method.toUpperCase(),
    percentEncode(baseUrl),
    percentEncode(normalized),
  ].join("&");

  const signature = createHmac("sha256", `${consumerSecret}&`)
    .update(stringToSign)
    .digest("base64");

  return { ...oauthParams, oauth_signature: signature };
}
