/**
 * fetch() hacia WordPress con dos protecciones para el hosting compartido de Hostinger:
 *
 * - Cola: como mucho MAX_IN_FLIGHT peticiones a la vez por proceso. Una página de colección
 *   pide los productos y las variaciones de cada uno en paralelo; con varias páginas
 *   generándose a la vez (build o regeneración) se juntaban decenas de peticiones y el MySQL
 *   compartido rechazaba conexiones («Error establishing a database connection»).
 * - Reintentos: las lecturas (GET) que fallan con 5xx o error de red se repiten hasta
 *   RETRIES veces, esperando un poco más cada vez (0,4 s, 0,8 s, 1,6 s más un poco al azar).
 */
const MAX_IN_FLIGHT = 4;
const RETRIES = 3;

let inFlight = 0;
const waiting: (() => void)[] = [];

async function acquire() {
  if (inFlight < MAX_IN_FLIGHT) {
    inFlight++;
    return;
  }
  await new Promise<void>((resolve) => waiting.push(resolve));
}

function release() {
  const next = waiting.shift();
  if (next) next();
  else inFlight--;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function wpFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const isRead = !init.method || init.method === "GET";
  for (let attempt = 0; ; attempt++) {
    await acquire();
    let res: Response | undefined;
    let error: unknown;
    try {
      res = await fetch(input, init);
    } catch (e) {
      error = e;
    } finally {
      release();
    }
    const retryable = isRead && attempt < RETRIES && (error !== undefined || (res !== undefined && res.status >= 500));
    if (!retryable) {
      if (error !== undefined) throw error;
      return res as Response;
    }
    await sleep(400 * 2 ** attempt + Math.random() * 300);
  }
}
