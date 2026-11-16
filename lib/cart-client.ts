import type { CartActionState } from "@/lib/actions/cart";

/** Cambios del carrito desde el navegador, por la ruta /api/cart (ver app/api/cart/route.ts). */
async function postCart(body: unknown): Promise<CartActionState> {
  const res = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  try {
    return (await res.json()) as CartActionState;
  } catch {
    return { status: "error", message: "The cart could not be updated." };
  }
}

export const addToCartRequest = (productId: number, quantity = 1) =>
  postCart({ action: "add", productId, quantity });

export const setCartItemQuantityRequest = (itemKey: string, quantity: number) =>
  postCart({ action: "quantity", itemKey, quantity });
