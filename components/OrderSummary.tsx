import Image from "next/image";
import { formatMoney, parsePrice } from "@/lib/format";
import type { WCOrder } from "@/lib/woocommerce/types";

const money = (value: string, currency: string) => formatMoney(parsePrice(value) ?? 0, currency);
/** Suma importe + impuestos, para mostrar los precios como en la tienda (IVA incluido). */
const withTax = (value: string, tax: string) => (parsePrice(value) ?? 0) + (parsePrice(tax) ?? 0);

/** Resumen de un pedido: productos, envío y total. */
export function OrderSummary({ order }: { order: WCOrder }) {
  const { currency } = order;
  const shipping = withTax(order.shipping_total, order.shipping_tax);
  const discount = withTax(order.discount_total, order.discount_tax);

  return (
    <div className="border border-line">
      <ul className="divide-y divide-line px-6">
        {order.line_items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 py-5">
            <div className="relative h-24 w-20 shrink-0 overflow-hidden">
              {item.image?.src && (
                <Image src={item.image.src} alt={item.name} fill sizes="80px" className="no-reveal object-cover" />
              )}
            </div>
            <div className="flex flex-1 justify-between gap-3">
              <span>
                <span>{item.name}</span>
                <span> × {item.quantity}</span>
              </span>
              <span>{formatMoney(withTax(item.total, item.total_tax), currency)}</span>
            </div>
          </li>
        ))}
      </ul>

      <dl className="space-y-2 border-t border-line px-6 py-5">
        {discount > 0 && (
          <div className="flex justify-between">
            <dt>Discount</dt>
            <dd>−{formatMoney(discount, currency)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt>
            Shipping{order.shipping_lines[0]?.method_title ? ` · ${order.shipping_lines[0].method_title}` : ""}
          </dt>
          <dd>{shipping > 0 ? formatMoney(shipping, currency) : "Free"}</dd>
        </div>
        <div className="flex justify-between border-t border-line pt-3">
          <dt>Total</dt>
          <dd>{money(order.total, currency)}</dd>
        </div>
        {parsePrice(order.total_tax) ? (
          <p className="text-right">Includes {money(order.total_tax, currency)} VAT</p>
        ) : null}
      </dl>
    </div>
  );
}
