"use client";

import { WPImage } from "@/components/WPImage";
import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { setCartItemQuantityAction } from "@/lib/actions/cart";
import {
  getCartSnapshot,
  getOpenSnapshot,
  mutateCart,
  resolveItemKey,
  setCartOpen,
  subscribeCart,
  syncServerCart,
  withQuantity,
} from "@/lib/cart-store";
import { formatMoney } from "@/lib/format";
import type { Cart, CartItem } from "@/lib/store-api";
import { IconClose, IconMinus, IconPlus } from "./Icons";
import { lockPageScroll } from "@/lib/scroll-lock";

/** Abre el carrito lateral desde cualquier parte (p. ej. al añadir un producto). */
export function openCart() {
  setCartOpen(true);
}

const noopSubscribe = () => () => {};

/** Cambia las unidades de una línea: se ve al instante y se confirma con WooCommerce detrás. */
function changeQuantity(item: CartItem, quantity: number) {
  mutateCart(
    (cart) => withQuantity(cart, item.key, quantity),
    async () => {
      // Se resuelve al llegarle el turno en la cola (la línea puede ser recién añadida).
      const key = resolveItemKey(item);
      if (!key) return { status: "error" as const, message: "The cart could not be updated." };
      return setCartItemQuantityAction(key, quantity);
    },
  );
}

function QtyButton({
  children,
  label,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      // touch-manipulation: en móvil cada toque cuenta al momento (sin la espera del doble
      // toque para hacer zoom). El ::before amplía la zona de toque sin cambiar el diseño.
      className="relative flex h-[27px] w-[27px] touch-manipulation select-none items-center justify-center bg-surface transition-colors before:absolute before:-inset-[6px] before:content-[''] hover:bg-foreground hover:text-background disabled:opacity-40 duration-300"
    >
      {children}
    </button>
  );
}

/**
 * Carrito lateral. El carrito inicial llega del servidor (Header → HeaderNav); después,
 * cada cambio (añadir, +, −) se pinta al momento desde lib/cart-store.ts y se
 * confirma con WooCommerce en segundo plano. `cart` es null si WordPress no responde.
 */
export function CartDrawer({ cart: initialCart }: { cart: Cart | null }) {
  useEffect(() => {
    syncServerCart(initialCart);
  }, [initialCart]);

  const storeCart = useSyncExternalStore(subscribeCart, getCartSnapshot, () => null);
  const cart = storeCart ?? initialCart;
  const open = useSyncExternalStore(subscribeCart, getOpenSnapshot, () => false);
  const close = () => setCartOpen(false);
  // El panel se pinta en <body> (portal) para que la cabecera fija no lo recorte.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCartOpen(false);
    document.addEventListener("keydown", onKey);
    const unlock = lockPageScroll();
    return () => {
      document.removeEventListener("keydown", onKey);
      unlock();
    };
  }, [open]);

  const count = cart?.itemCount ?? 0;

  return (
    <>
      <button
        type="button"
        onClick={openCart}
        className="hover:opacity-60"
        aria-haspopup="dialog"
        aria-controls="cart-drawer"
      >
        <span className="hidden lg:inline">Cart </span>({cart ? count : "!"})
      </button>

      {mounted &&
        createPortal(
          <>
            {/* Velo blanco al 56% sobre el resto de la página, como en la web real */}
            <div
              onClick={close}
              aria-hidden="true"
              className={`fixed inset-0 z-40 touch-none bg-white/[0.56] transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
            />

            {/* Panel: entra y sale con una curva que frena suave al final (la de los paneles de iOS),
                en 0,5 s, a la vez que el velo. */}
            <aside
              id="cart-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Cart"
              inert={!open}
              className={`fixed inset-y-0 right-0 z-50 flex w-[90%] flex-col border-l border-line bg-background transition-[translate] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[translate] sm:max-w-sm lg:w-[max(380px,25vw)] lg:max-w-none ${open ? "translate-x-0" : "translate-x-full"}`}
            >
              {/* Fila superior con la X, con fondo blanco: los productos pasan por debajo al
                  hacer scroll sin verse detrás de la X (igual que la zona de abajo). */}
              <div className="absolute inset-x-0 top-0 z-10 h-[55px] bg-background">
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close cart"
                  className="absolute right-5 top-4 flex h-6 items-center lg:right-[15px]"
                >
                  <IconClose />
                </button>
              </div>
              {!cart ? (
                <p className="p-6 text-foreground">The cart could not be loaded. Please try again in a moment.</p>
              ) : cart.items.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
                  <p className="text-foreground">Your cart is empty.</p>
                  <Link href="/store" onClick={close} className="underline transition-opacity duration-300 hover:opacity-60">
                    Go to the store
                  </Link>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto overscroll-contain px-5 pt-[70px] lg:px-[15px]">
                    <ul>
                      {cart.items.map((item) => {
                        const atMax = item.maxQuantity !== null && item.quantity >= item.maxQuantity;
                        return (
                          <li key={item.key} className="flex gap-4 py-4">
                            <Link
                              href={`/product/${item.slug}`}
                              onClick={close}
                              className="relative aspect-[4/5] w-24 shrink-0 self-start overflow-hidden lg:w-[120px]"
                            >
                              {item.image && (
                                <WPImage
                                  src={item.image}
                                  alt={item.name}
                                  className="object-cover"
                                />
                              )}
                            </Link>
                            <div className="flex flex-1 flex-col justify-between py-1">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <Link
                                    href={`/product/${item.slug}`}
                                    onClick={close}
                                    className="transition-opacity hover:opacity-60 duration-300"
                                  >
                                    <span translate="no">{item.name}</span>
                                  </Link>
                                  {item.variation.map((v) => (
                                    <p key={v.attribute} translate="no">{v.value}</p>
                                  ))}
                                </div>
                                {/* Precio en la esquina superior derecha */}
                                <p className="shrink-0 text-right" translate="no">{formatMoney(item.lineSubtotal, cart.currency)}</p>
                              </div>
                              {/* Selector de unidades a la izquierda (con − en 1 se quita del carrito) */}
                              <div className="mt-2 flex items-center justify-start">
                                <div className="flex items-center gap-2">
                                  <QtyButton
                                    label={item.quantity === 1 ? "Remove from cart" : "Remove one"}
                                    onClick={() => changeQuantity(item, item.quantity - 1)}
                                  >
                                    <IconMinus />
                                  </QtyButton>
                                  <span className="w-6 text-center" aria-live="polite">
                                    {item.quantity}
                                  </span>
                                  <QtyButton
                                    label="Add one"
                                    disabled={atMax}
                                    onClick={() => changeQuantity(item, item.quantity + 1)}
                                  >
                                    <IconPlus />
                                  </QtyButton>
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Botón de pagar abajo del todo, dentro del margen de 15px del panel.
                      Enlace normal (no <Link>): /checkout redirige al checkout de WooCommerce. */}
                  <div className="p-5 lg:p-[15px]">
                    {/* Subtotal justo encima del botón (móvil y escritorio): texto a la izquierda y
                        precio a la derecha, en la misma fila */}
                    <div className="mb-[15px] flex items-baseline justify-between">
                      <span>Subtotal</span>
                      <span translate="no">{formatMoney(cart.subtotal, cart.currency)}</span>
                    </div>
                    {/* Navegación completa (no <Link>): /checkout es una ruta que redirige al
                        checkout de WooCommerce en WordPress. */}
                    {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                    <a
                      href="/checkout"
                      className="block bg-surface px-[10px] py-[5px] text-center transition-colors hover:bg-foreground hover:text-background duration-300"
                    >
                      Checkout
                    </a>
                  </div>
                </>
              )}
            </aside>
          </>,
          document.body,
        )}
    </>
  );
}
