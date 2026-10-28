import { connection } from "next/server";
import { WooCommerceError, wooFetch } from "./client";
import type { WCOrder } from "./types";

/**
 * Pedido para mostrar al cliente en las páginas de «gracias» y «error».
 * WordPress redirige con ?order=<id>&key=<order_key>: solo se devuelve el pedido si la clave
 * coincide (la misma comprobación que hace WooCommerce en su página de «Pedido recibido»),
 * así nadie puede ver un pedido ajeno cambiando el número en la URL.
 */
export async function getOrderForCustomer(id: string | undefined, key: string | undefined): Promise<WCOrder | null> {
  if (!id || !/^\d+$/.test(id) || !key || !key.startsWith("wc_order_")) return null;
  try {
    await connection(); // pedido en directo, nunca en caché
    const order = await wooFetch<WCOrder>(`/orders/${id}`);
    return order.order_key === key ? order : null;
  } catch (e) {
    if (e instanceof WooCommerceError && (e.status === 404 || e.status === 400)) return null;
    throw e;
  }
}

/** Estados en los que el pedido está hecho aunque el pago aún se esté confirmando. */
export const PAYMENT_PENDING_STATUSES = ["pending", "on-hold"];
