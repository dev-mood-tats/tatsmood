import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getOrderForCustomer } from "@/lib/woocommerce/orders";

// Página de un pedido concreto: fuera de Google.
export const metadata: Metadata = { title: "Order not completed", robots: { index: false, follow: false } };

// WordPress manda aquí al cliente si el pago ha fallado (?order=<id>&key=<order_key>)
// o si ha cancelado el pedido (?reason=cancelled). El carrito de la web se conserva.

const button = "inline-flex h-[45px] items-center bg-surface px-[30px] transition-colors duration-300 hover:bg-foreground hover:text-background";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function OrderError({ searchParams }: { searchParams: PageProps<"/order/error">["searchParams"] }) {
  const params = await searchParams;
  const cancelled = first(params.reason) === "cancelled";
  const order = cancelled ? null : await getOrderForCustomer(first(params.order), first(params.key));
  const canRetry = order && ["failed", "pending"].includes(order.status) && order.payment_url;

  return (
    <>
      {order && <p>Order #{order.number}</p>}
      <p className="mt-3">{cancelled ? "You have cancelled your order" : "The payment could not be completed"}</p>
      <p className="mx-auto mt-4 max-w-md">
        {cancelled
          ? "Nothing has been charged. Your cart is still there in case you want to finish your purchase later."
          : "Nothing has been charged. The card may have been declined or the payment interrupted. Please try again or use another payment method."}
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
        {canRetry ? (
          // Enlace normal: lleva a la página de pago de WooCommerce.
          <a href={order.payment_url} className={button}>
            Try again
          </a>
        ) : (
          // /checkout redirige al checkout de WooCommerce con el carrito actual (navegación
          // completa, no <Link>).
          // eslint-disable-next-line @next/next/no-html-link-for-pages
          <a href="/checkout" className={button}>
            Back to checkout
          </a>
        )}
        <Link href="/store" className="underline transition-opacity duration-300 hover:opacity-60">
          Back to the store
        </Link>
      </div>
      <p className="mt-12">If the problem persists, write to us at hello@tatsmood.com.</p>
    </>
  );
}

export default function OrderErrorPage({ searchParams }: PageProps<"/order/error">) {
  return (
    <div className="mx-auto max-w-6xl px-5 py-24 text-center lg:px-[15px]">
      <Suspense fallback={<div className="mx-auto h-8 w-64" />}>
        <OrderError searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
