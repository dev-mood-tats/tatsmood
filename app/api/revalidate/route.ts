import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";

/**
 * Webhook de WooCommerce y avisos de WordPress: cuando se crea, edita o borra un producto (o entra un pedido,
 * que cambia el stock), WooCommerce llama aquí y se vacía la caché del catálogo, así el
 * cambio se ve en la web al momento.
 *
 * Alta en WordPress → WooCommerce → Ajustes → Avanzado → Webhooks, un webhook por tema
 * (Producto creado / actualizado / eliminado / restaurado y Pedido creado):
 *   - URL de entrega: https://<dominio>/api/revalidate
 *   - Secreto: el mismo valor que WC_WEBHOOK_SECRET en las variables de entorno.
 */
export async function POST(request: Request) {
  const secret = process.env.WC_WEBHOOK_SECRET;
  if (!secret) return new Response("WC_WEBHOOK_SECRET no configurado", { status: 500 });

  const body = await request.text();
  // Firma de WooCommerce (webhooks de productos y pedidos) o de WordPress (contenidos:
  // colecciones, páginas, ajustes de la home; ver mu-plugins/tatsmood-content.php).
  // Las dos con el mismo secreto.
  const signature = request.headers.get("x-wc-webhook-signature") ?? request.headers.get("x-tatsmood-signature");

  // Al guardar el webhook, WooCommerce manda un "ping" sin firma para comprobar la URL.
  if (!signature) {
    return body.startsWith("webhook_id=") ? new Response("ok") : new Response(null, { status: 401 });
  }

  const expected = createHmac("sha256", secret).update(body).digest();
  const received = Buffer.from(signature, "base64");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return new Response(null, { status: 401 });
  }

  // Caducidad inmediata (lo que recomienda Next para webhooks): la siguiente visita ya
  // recibe los datos nuevos.
  revalidateTag("catalog", { expire: 0 });
  revalidateTag("content", { expire: 0 });
  return Response.json({ revalidated: true });
}
