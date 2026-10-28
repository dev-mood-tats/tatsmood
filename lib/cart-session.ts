import { cookies } from "next/headers";
import { emptyCart, fetchCart, type Cart } from "@/lib/store-api";

// Guardamos el Cart-Token de la Store API de WooCommerce en una cookie httpOnly:
// el navegador nunca lo ve ni habla directamente con WordPress.
const COOKIE_NAME = "tatsmood_cart";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

export async function getCartToken(): Promise<string | null> {
  return (await cookies()).get(COOKIE_NAME)?.value ?? null;
}

/** Solo se puede llamar desde Server Actions o Route Handlers. */
export async function setCartToken(token: string | null) {
  if (!token) return;
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: THIRTY_DAYS,
  });
}

/** Carrito actual del visitante (vacío si todavía no tiene). */
export async function getCurrentCart(): Promise<Cart> {
  const token = await getCartToken();
  if (!token) return emptyCart;
  return fetchCart(token);
}
