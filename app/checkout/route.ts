import { NextResponse } from "next/server";
import { getCartToken, setCartToken } from "@/lib/cart-session";
import { fetchCart } from "@/lib/store-api";
import { getCheckoutUrl } from "@/lib/woocommerce/checkout-url";
import { siteUrl } from "@/lib/seo";

/**
 * "Finalizar compra": manda al cliente al checkout de WooCommerce con su carrito.
 * WooCommerce recupera el carrito de la Store API a partir del token (?session=…) y ahí
 * se encargan los plugins oficiales del envío y del pago (Stripe, PayPal, Klarna…).
 */
export async function GET() {
  const token = await getCartToken();
  const cart = token
    ? await fetchCart(token).catch((e) => {
        console.error("[checkout] No se pudo leer el carrito:", e);
        return null;
      })
    : null;

  if (!cart || !cart.token || cart.items.length === 0) {
    console.warn(`[checkout] Sin carrito (${!token ? "sin token" : !cart ? "error al leerlo" : "vacío"}): a la tienda.`);
    // Con la dirección pública de la web (SITE_URL), no con la de la petición: detrás del
    // proxy de Hostinger, la petición llega a Next.js como http://0.0.0.0:3000.
    return NextResponse.redirect(`${siteUrl()}/store`);
  }
  if (cart.token !== token) await setCartToken(cart.token);

  const checkoutUrl = new URL(await getCheckoutUrl());
  checkoutUrl.searchParams.set("session", cart.token);
  return NextResponse.redirect(checkoutUrl);
}
