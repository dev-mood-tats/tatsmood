import { NextResponse, type NextRequest } from "next/server";
import { getCartToken, setCartToken } from "@/lib/cart-session";
import { fetchCart } from "@/lib/store-api";
import { getCheckoutUrl } from "@/lib/woocommerce/checkout-url";

/**
 * "Finalizar compra": manda al cliente al checkout de WooCommerce con su carrito.
 * WooCommerce recupera el carrito de la Store API a partir del token (?session=…) y ahí
 * se encargan los plugins oficiales del envío y del pago (Stripe, PayPal, Klarna…).
 */
export async function GET(request: NextRequest) {
  const token = await getCartToken();
  const cart = token ? await fetchCart(token).catch(() => null) : null;

  if (!cart || !cart.token || cart.items.length === 0) {
    return NextResponse.redirect(new URL("/store", request.url));
  }
  if (cart.token !== token) await setCartToken(cart.token);

  const checkoutUrl = new URL(await getCheckoutUrl());
  checkoutUrl.searchParams.set("session", cart.token);
  return NextResponse.redirect(checkoutUrl);
}
