"use server";

import { getCartToken, setCartToken } from "@/lib/cart-session";
import { addItem, removeItem, updateItem, type Cart } from "@/lib/store-api";

// Acciones del carrito. Para que sean rápidas:
// - Devuelven el carrito actualizado (sin el token, que se queda en la cookie) y el
//   carrito lateral lo pinta directamente. No se llama a refresh(): volver a renderizar
//   toda la página en el servidor (productos, ACF, variaciones…) era lo que tardaba ~2 s.
// - La cookie solo se escribe cuando el token cambia (en la práctica, el primer producto
//   añadido), porque escribir una cookie en una Server Action también obliga a Next.js
//   a volver a renderizar la página.

export type CartActionState = { status: "idle" | "success" | "error"; message: string; cart?: Cart };

const publicCart = (cart: Cart): Cart => ({ ...cart, token: null });

async function saveTokenIfChanged(current: string | null, cart: Cart) {
  if (cart.token && cart.token !== current) await setCartToken(cart.token);
}

export async function addToCartAction(_prev: CartActionState, formData: FormData): Promise<CartActionState> {
  const productId = Number(formData.get("productId"));
  const quantity = Math.max(1, Number(formData.get("quantity") ?? 1) || 1);

  if (!Number.isInteger(productId) || productId <= 0) {
    return { status: "error", message: "Invalid product." };
  }

  try {
    const token = await getCartToken();
    const cart = await addItem(token, productId, quantity);
    await saveTokenIfChanged(token, cart);
    return { status: "success", message: "Added to cart.", cart: publicCart(cart) };
  } catch (e) {
    console.error("[carrito] Error al añadir:", e);
    return { status: "error", message: e instanceof Error ? e.message : "The product could not be added to the cart." };
  }
}

/** Cambia las unidades de una línea del carrito (0 o menos la quita). */
export async function setCartItemQuantityAction(itemKey: string, quantity: number): Promise<CartActionState> {
  try {
    const token = await getCartToken();
    if (!token) return { status: "error", message: "There is no cart." };
    const cart =
      !Number.isFinite(quantity) || quantity <= 0
        ? await removeItem(token, itemKey)
        : await updateItem(token, itemKey, Math.floor(quantity));
    await saveTokenIfChanged(token, cart);
    return { status: "success", message: "", cart: publicCart(cart) };
  } catch (e) {
    console.error("[carrito] Error al actualizar:", e);
    return { status: "error", message: e instanceof Error ? e.message : "The cart could not be updated." };
  }
}
