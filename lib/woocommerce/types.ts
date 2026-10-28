// Tipos de la API REST de WooCommerce (wc/v3). Solo los campos que usamos.

export interface WCImage {
  id: number;
  src: string;
  name: string;
  alt: string;
  /** Tamaño original (de wp/v2/media). Sirve para reservar el hueco de la foto antes de que cargue. */
  width?: number;
  height?: number;
  /** Centro de interés en % ([x, y]) marcado en Medios; se usa al recortar la foto. */
  focal?: [number, number];
}

export interface WCCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description: string;
  count: number;
  image: WCImage | null;
}

export interface WCProductAttribute {
  id: number;
  name: string;
  visible: boolean;
  /** true si WooCommerce usa este atributo para generar variaciones (talla, idioma, color…). */
  variation: boolean;
  options: string[];
}

export type WCStockStatus = "instock" | "outofstock" | "onbackorder";

export interface WCProduct {
  /** Campos ACF del grupo "Single product" (imagen de hover, galería shoot_1-4, acordeones). */
  acf: import("./acf").WCProductAcf;
  id: number;
  name: string;
  slug: string;
  permalink: string;
  type: string;
  status: string;
  featured: boolean;
  related_ids: number[];
  description: string;
  short_description: string;
  sku: string;
  /** Precio actual como texto decimal ("45.00"), vacío si no tiene precio. */
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  purchasable: boolean;
  stock_status: WCStockStatus;
  stock_quantity: number | null;
  weight: string;
  dimensions: { length: string; width: string; height: string };
  categories: { id: number; name: string; slug: string }[];
  tags: { id: number; name: string; slug: string }[];
  images: WCImage[];
  attributes: WCProductAttribute[];
}

// Solo para productos variables (tallas: S, M, L…). Cada variación es, para la Store API,
// un producto con su propio id: se añade al carrito igual que un producto simple.
export interface WCVariation {
  id: number;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  purchasable: boolean;
  stock_status: WCStockStatus;
  stock_quantity: number | null;
  attributes: { id: number; name: string; option: string }[];
  image: WCImage | null;
}

export interface WCOrderLineItem {
  id: number;
  name: string;
  product_id: number;
  quantity: number;
  /** Total de la línea sin impuestos ("45.00"). */
  total: string;
  total_tax: string;
  image?: { id: number | string; src: string } | null;
}

export interface WCOrder {
  id: number;
  number: string;
  order_key: string;
  status: string;
  currency: string;
  date_created: string;
  total: string;
  shipping_total: string;
  shipping_tax: string;
  discount_total: string;
  discount_tax: string;
  total_tax: string;
  prices_include_tax: boolean;
  payment_method_title: string;
  /** Enlace de WooCommerce para volver a intentar el pago de un pedido pendiente o fallido. */
  payment_url: string;
  billing: { first_name: string; email: string };
  shipping: {
    first_name: string;
    last_name: string;
    address_1: string;
    address_2: string;
    postcode: string;
    city: string;
    state: string;
    country: string;
  };
  line_items: WCOrderLineItem[];
  shipping_lines: { method_title: string; total: string; total_tax: string }[];
}
