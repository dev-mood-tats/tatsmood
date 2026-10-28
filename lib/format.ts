const CURRENCY = "EUR";

export function formatMoney(amount: number, currency: string = CURRENCY): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(amount);
}

/** Precios de WooCommerce REST ("45.00") → número. */
export function parsePrice(value: string | undefined | null): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Precios de la Store API vienen en unidades mínimas ("4500" = 45,00 €). */
export function fromMinorUnits(value: string | number | undefined, minorUnit = 2): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n / 10 ** minorUnit : 0;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  laquo: "«",
  raquo: "»",
  hellip: "…",
  ndash: "–",
  mdash: "—",
};

/** Convierte entidades HTML (&quot;, &#039;, &#8220;…) en caracteres. WooCommerce las manda en textos y avisos. */
export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : match;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? match;
  });
}

