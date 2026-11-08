"use client";

import type { Cart, CartItem } from "@/lib/store-api";
import { addToCartAction, type CartActionState } from "@/lib/actions/cart";

// Estado del carrito en el navegador, compartido por la cabecera, el carrito lateral y
// los botones de añadir. El servidor da el carrito inicial; a partir de ahí cada cambio:
// 1. se pinta al instante con una versión "optimista" (lo que esperamos que pase),
// 2. se manda a WooCommerce en una cola (de uno en uno, para que varios clics seguidos
//    en + no lleguen desordenados y el resultado final sea el correcto),
// 3. y cuando WooCommerce responde se pinta su carrito real (si no hay cambios más nuevos
//    esperando). Si falla, se vuelve al último carrito bueno.

let serverCart: Cart | null = null;
let localCart: Cart | null = null;
let confirmedCart: Cart | null = null;
let isOpen = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

export function subscribeCart(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getCartSnapshot = () => localCart ?? serverCart;

/** Último carrito confirmado por WooCommerce (con las claves reales de cada línea). */
const getConfirmedCart = () => confirmedCart ?? serverCart;
export const getOpenSnapshot = () => isOpen;

/** Lo llama el carrito lateral con el carrito que trae el servidor al cargar la página. */
export function syncServerCart(cart: Cart | null) {
  if (cart === serverCart) return;
  serverCart = cart;
  if (pending === 0) {
    localCart = null;
    confirmedCart = null;
  }
  emit();
}

export function setCartOpen(value: boolean) {
  isOpen = value;
  emit();
}

let queue: Promise<unknown> = Promise.resolve();
let pending = 0;

/**
 * Aplica un cambio optimista y lanza la petición real en la cola.
 * `run` devuelve el resultado de la Server Action.
 */
export function mutateCart(optimistic: (cart: Cart) => Cart, run: () => Promise<CartActionState>) {
  const current = getCartSnapshot();
  if (!confirmedCart) confirmedCart = current;
  if (current) localCart = optimistic(current);
  pending++;
  emit();

  const job = queue.then(async () => {
    let result: CartActionState | null = null;
    try {
      result = await run();
    } catch (e) {
      console.error("[carrito]", e);
    }
    pending--;
    if (result?.status === "success" && result.cart) {
      confirmedCart = result.cart;
      // Si hay más cambios en cola, se mantiene lo optimista hasta el último.
      if (pending === 0) localCart = result.cart;
    } else if (pending === 0) {
      localCart = confirmedCart;
    }
    emit();
    return result;
  });
  queue = job;
  return job;
}

function totals(cart: Cart, items: CartItem[]): Cart {
  return {
    ...cart,
    items,
    itemCount: items.reduce((n, i) => n + i.quantity, 0),
    subtotal: items.reduce((n, i) => n + i.lineSubtotal, 0),
  };
}

/** Carrito con una línea cambiada a `quantity` unidades (0 la quita). */
export function withQuantity(cart: Cart, key: string, quantity: number): Cart {
  const items = cart.items.flatMap((i) =>
    i.key !== key ? [i] : quantity <= 0 ? [] : [{ ...i, quantity, lineSubtotal: i.unitPrice * quantity }],
  );
  return totals(cart, items);
}

export type OptimisticProduct = {
  productId: number;
  name: string;
  slug: string;
  image: string | null;
  unitPrice: number;
  variation: { attribute: string; value: string }[];
};

/** Carrito con una unidad más del producto (o una línea nueva provisional). */
export function withAddedProduct(cart: Cart, p: OptimisticProduct): Cart {
  const existing = cart.items.find((i) => i.productId === p.productId);
  if (existing) return withQuantity(cart, existing.key, existing.quantity + 1);
  const item: CartItem = {
    key: `temp-${p.productId}`,
    productId: p.productId,
    name: p.name,
    slug: p.slug,
    quantity: 1,
    maxQuantity: null,
    unitPrice: p.unitPrice,
    lineSubtotal: p.unitPrice,
    image: p.image,
    variation: p.variation,
  };
  return totals(cart, [...cart.items, item]);
}

/** Línea provisional: se acaba de añadir y WooCommerce aún no le ha dado su clave real. */
export const isTempItem = (item: CartItem) => item.key.startsWith("temp-");

/**
 * Clave real de una línea para mandarla a WooCommerce. Si la línea era provisional, se
 * busca en el carrito confirmado: como los cambios van en cola, cuando le toca el turno a
 * este cambio el «añadir» de antes ya ha terminado y la línea ya tiene su clave.
 */
export function resolveItemKey(item: CartItem): string | null {
  if (!isTempItem(item)) return item.key;
  return getConfirmedCart()?.items.find((i) => i.productId === item.productId)?.key ?? null;
}

/**
 * Añade una unidad de un producto y abre el carrito lateral medio segundo después, ya con
 * él dentro (para que antes se vea el destello del botón pulsado).
 */
export function addToCart(p: OptimisticProduct) {
  const formData = new FormData();
  formData.set("productId", String(p.productId));
  formData.set("quantity", "1");
  const job = mutateCart(
    (cart) => withAddedProduct(cart, p),
    () => addToCartAction({ status: "idle", message: "" }, formData),
  );
  window.setTimeout(() => setCartOpen(true), 500);
  return job;
}
