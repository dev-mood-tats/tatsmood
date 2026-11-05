import { formatMoney, parsePrice } from "@/lib/format";
import type { WCProduct } from "@/lib/woocommerce/types";

export function Price({ product, className = "" }: { product: WCProduct; className?: string }) {
  const price = parsePrice(product.price);
  const regular = parsePrice(product.regular_price);

  if (price === null) return <span className={`text-foreground ${className}`}>Consultar precio</span>;

  if (product.on_sale && regular !== null && regular > price) {
    return (
      <span className={className} translate="no">
        <span className="text-accent">{formatMoney(price)}</span>{" "}
        <s className="text-foreground text-[0.9em]">{formatMoney(regular)}</s>
      </span>
    );
  }

  return <span className={className} translate="no">{formatMoney(price)}</span>;
}
