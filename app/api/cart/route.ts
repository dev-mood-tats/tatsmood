import { NextResponse } from "next/server";
import { addToCartAction, setCartItemQuantityAction, type CartActionState } from "@/lib/actions/cart";

/**
 * Cambios del carrito desde el navegador (lib/cart-client.ts): añadir y cambiar unidades.
 *
 * Es una ruta normal y no una Server Action a propósito: cuando una Server Action escribe la
 * cookie del carrito (el primer producto añadido), Next.js vuelve a renderizar la página entera
 * en la misma respuesta. Si mientras tanto se pulsaba «Checkout», Safari cortaba esa respuesta
 * y Next.js enseñaba un instante su pantalla de error. Aquí la cookie se escribe igual, pero
 * la respuesta es solo el carrito y la web no se vuelve a renderizar. (Igual que en Cousas.)
 */
type Body =
  | { action: "add"; productId: number; quantity?: number }
  | { action: "quantity"; itemKey: string; quantity: number };

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json<CartActionState>({ status: "error", message: "Invalid request." }, { status: 400 });
  }

  let result: CartActionState;
  if (body?.action === "add") {
    const formData = new FormData();
    formData.set("productId", String(body.productId));
    formData.set("quantity", String(body.quantity ?? 1));
    result = await addToCartAction({ status: "idle", message: "" }, formData);
  } else if (body?.action === "quantity" && typeof body.itemKey === "string") {
    result = await setCartItemQuantityAction(body.itemKey, Number(body.quantity));
  } else {
    result = { status: "error", message: "Invalid request." };
  }
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
