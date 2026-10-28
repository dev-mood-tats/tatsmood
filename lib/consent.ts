// Consentimiento de cookies (banner propio, components/CookieBanner.tsx). Se guarda en la
// cookie «tm_consent» durante un año. Las cookies necesarias van siempre; las opcionales
// (lib/cookies.ts) solo si el visitante las acepta. components/ConsentScripts.tsx carga
// los scripts de cada categoría según esto y escucha el evento «tm-consent» por si cambia.

import { CATEGORY_COOKIE_PREFIXES, type OptionalCategory } from "./cookies";

export type Consent = Record<OptionalCategory, boolean> & { date: string };

export const CONSENT_COOKIE = "tm_consent";
export const CONSENT_EVENT = "tm-consent";
/** Evento para volver a abrir las preferencias (también lo hace cualquier enlace a «#cookie-settings»). */
export const OPEN_CONSENT_EVENT = "tm-open-consent";

export function getConsent(): Consent | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie.split("; ").find((c) => c.startsWith(`${CONSENT_COOKIE}=`));
  if (!raw) return null;
  try {
    const value = JSON.parse(decodeURIComponent(raw.slice(CONSENT_COOKIE.length + 1)));
    // Formato antiguo ({ marketing }): se vuelve a preguntar.
    return typeof value?.performance === "boolean" ? (value as Consent) : null;
  } catch {
    return null;
  }
}

export function saveConsent(choice: Record<OptionalCategory, boolean>) {
  const previous = getConsent();
  const value: Consent = { ...choice, date: new Date().toISOString() };
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(value))}; max-age=${60 * 60 * 24 * 365}; path=/; samesite=lax`;

  // Permiso retirado: se borran sus cookies y se recarga para que sus scripts dejen de funcionar.
  const revoked = (Object.keys(CATEGORY_COOKIE_PREFIXES) as OptionalCategory[]).filter((c) => previous?.[c] && !choice[c]);
  if (revoked.length) {
    const prefixes = revoked.flatMap((c) => CATEGORY_COOKIE_PREFIXES[c]);
    const host = location.hostname.split(".").slice(-2).join(".");
    for (const c of document.cookie.split("; ")) {
      const name = c.split("=")[0];
      if (!prefixes.some((p) => name.startsWith(p))) continue;
      for (const domain of ["", `; domain=.${host}`, `; domain=${location.hostname}`]) {
        document.cookie = `${name}=; max-age=0; path=/${domain}`;
      }
    }
    location.reload();
    return;
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
}
