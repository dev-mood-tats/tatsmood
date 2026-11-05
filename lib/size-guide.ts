// «Size guide» de la ficha de producto: el texto del campo ACF desplegable_2 y, si la tiene,
// la tabla de tallas del panel «Tabla de tallas» de WordPress (mu-plugin
// tatsmood-size-guide.php, campo «tatsmood_size_table», JSON).
//
// Las tallas y las medidas van marcadas para que los traductores automáticos del navegador
// no las toquen («S», «M»… salían como «sg», «metro»). Los nombres de las medidas («Width»,
// «Length») sí se traducen.

type SizeTable = { unit?: string; sizes: string[]; rows: { label: string; values: string[] }[] };

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function parseTable(raw: string | undefined): SizeTable | null {
  if (!raw) return null;
  try {
    const t = JSON.parse(raw) as SizeTable;
    return Array.isArray(t?.sizes) && t.sizes.length && Array.isArray(t.rows) && t.rows.length ? t : null;
  } catch {
    return null;
  }
}

function tableHtml(t: SizeTable): string {
  const unit = (t.unit ?? "").trim();
  // Solo número → se le añade la unidad («45» → «45 cm»).
  const cell = (v: string) => {
    const value = (v ?? "").trim();
    return value && unit && /^[\d.,]+$/.test(value) ? `${value} ${unit}` : value;
  };
  const head = `<thead translate="no"><tr><th></th>${t.sizes.map((s) => `<th>${escapeHtml(s)}</th>`).join("")}</tr></thead>`;
  const body = t.rows
    .map(
      (r) =>
        `<tr><td>${escapeHtml(r.label)}</td>${t.sizes
          .map((_, i) => `<td translate="no">${escapeHtml(cell(r.values[i] ?? ""))}</td>`)
          .join("")}</tr>`,
    )
    .join("");
  return `<table>${head}<tbody>${body}</tbody></table>`;
}

/** Tablas escritas a mano: cabecera (tallas) y celdas con medidas, sin traducir. */
function protectHandwrittenTables(html: string): string {
  return html
    .replace(/<thead(?![^>]*translate=)/gi, '<thead translate="no"')
    .replace(/<td(\s[^>]*)?>(\s*[\d.,]+\s*(?:cm|mm|in|kg|g|")?\s*)<\/td>/gi, (_m, attrs = "", text) =>
      /translate=/i.test(attrs) ? _m : `<td${attrs} translate="no">${text}</td>`,
    );
}

export function sizeGuideHtml(text: string | undefined, rawTable: string | undefined): string {
  const html = text ?? "";
  const table = parseTable(rawTable);
  if (!table) return protectHandwrittenTables(html);
  // Con la tabla del panel, la escrita a mano en el texto (si quedaba alguna) se sustituye
  // por esta, en el mismo sitio; si no había ninguna, la tabla va antes del texto.
  const tables = /<table[\s\S]*?<\/table>/gi;
  if (!tables.test(html)) return tableHtml(table) + html;
  let first = true;
  return html.replace(tables, () => {
    const out = first ? tableHtml(table) : "";
    first = false;
    return out;
  });
}
