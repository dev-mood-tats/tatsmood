import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { OrderSummary } from "@/components/OrderSummary";
import { getOrderForCustomer, PAYMENT_PENDING_STATUSES } from "@/lib/woocommerce/orders";

// Página de un pedido concreto: fuera de Google.
export const metadata: Metadata = { title: "Thank you", robots: { index: false, follow: false } };

// WordPress manda aquí al cliente tras completar el pedido: /order/thank-you?order=<id>&key=<order_key>

const button = "inline-flex h-[45px] items-center bg-surface px-[30px] transition-colors duration-300 hover:bg-foreground hover:text-background";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function Thanks({ searchParams }: { searchParams: PageProps<"/order/thank-you">["searchParams"] }) {
  const params = await searchParams;
  const order = await getOrderForCustomer(first(params.order), first(params.key));

  if (!order) {
    return (
      <>
        <h1>Thank you for your order!</h1>
        <p className="mt-4">We have received your order. You will get an email with all the details in a few minutes.</p>
        <Link href="/store" className={`mt-10 ${button}`}>
          Continue shopping
        </Link>
      </>
    );
  }

  const pendingPayment = PAYMENT_PENDING_STATUSES.includes(order.status);
  const date = new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(new Date(order.date_created));
  const s = order.shipping;

  return (
    <>
      <h1>Order #{order.number}</h1>
      <p className="mt-3">Thank you{order.billing.first_name ? `, ${order.billing.first_name}` : ""}!</p>
      <p className="mt-4 max-w-xl">
        {pendingPayment
          ? "We have received your order and are waiting for the payment confirmation. We will email you as soon as it is complete."
          : "Your order is confirmed. It will be printed and prepared in 2-3 business days before shipping."}{" "}
        {order.billing.email && <>We have sent the confirmation to {order.billing.email}.</>}
      </p>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_24rem]">
        <OrderSummary order={order} />

        <dl className="space-y-6">
          <div>
            <dt>Date</dt>
            <dd className="mt-1">{date}</dd>
          </div>
          {order.payment_method_title && (
            <div>
              <dt>Payment</dt>
              <dd className="mt-1">{order.payment_method_title}</dd>
            </div>
          )}
          {s.address_1 && (
            <div>
              <dt>Shipping to</dt>
              <dd className="mt-1">
                {s.first_name} {s.last_name}
                <br />
                {s.address_1}
                {s.address_2 && `, ${s.address_2}`}
                <br />
                {s.postcode} {s.city}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <Link href="/store" className={`mt-12 ${button}`}>
        Continue shopping
      </Link>
    </>
  );
}

export default function ThanksPage({ searchParams }: PageProps<"/order/thank-you">) {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16 lg:px-[15px]">
      <Suspense fallback={<div className="h-8 w-64" />}>
        <Thanks searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
