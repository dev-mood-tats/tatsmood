// Catálogo de cookies que enseña el banner (components/CookieBanner.tsx) en «Preferences».
// Las categorías opcionales solo aparecen si su herramienta está configurada en las variables
// de entorno; mientras no haya ninguna, el panel solo enseña las necesarias.
// Si se añade otra herramienta: su categoría aquí + su script en components/ConsentScripts.tsx.

export type CookieInfo = {
  name: string;
  provider: string;
  type: "First-party" | "Third-party";
  retention: string;
  purpose: string;
};

export type OptionalCategory = "performance" | "targeting";

export type CookieCategory = {
  id: "necessary" | OptionalCategory;
  title: string;
  description: string;
  cookies: CookieInfo[];
};

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

const necessary: CookieCategory = {
  id: "necessary",
  title: "Strictly necessary cookies",
  description:
    "These cookies are essential for the shop to work: they keep the products in your cart, your session during checkout and your cookie choices, and they let the payment providers process your order securely. The website cannot function properly without them, so they cannot be disabled.",
  cookies: [
    { name: "tm_consent", provider: "tatsmood", type: "First-party", retention: "1 year", purpose: "Remembers your cookie preferences." },
    { name: "tatsmood_cart", provider: "tatsmood", type: "First-party", retention: "30 days", purpose: "Keeps the products in your cart." },
    { name: "wp_woocommerce_session_*", provider: "WooCommerce", type: "First-party", retention: "2 days", purpose: "Keeps your cart and session during checkout." },
    { name: "woocommerce_cart_hash, woocommerce_items_in_cart", provider: "WooCommerce", type: "First-party", retention: "Session", purpose: "Let the checkout know when the contents of your cart change." },
    { name: "__stripe_mid, __stripe_sid", provider: "Stripe", type: "First-party", retention: "1 year / 30 minutes", purpose: "Fraud prevention when you pay by card." },
    { name: "PayPal cookies", provider: "PayPal", type: "Third-party", retention: "Varies", purpose: "Only if you pay with PayPal: needed to log in and complete the payment." },
  ],
};

const performance: CookieCategory = {
  id: "performance",
  title: "Performance cookies",
  description:
    "These cookies let us count visits and see how the website is used (which pages are most popular, where visitors come from), so we can improve it. All the information is aggregated.",
  cookies: [
    { name: "_ga", provider: "Google Analytics", type: "First-party", retention: "2 years", purpose: "Distinguishes visitors to count visits." },
    { name: "_ga_*", provider: "Google Analytics", type: "First-party", retention: "2 years", purpose: "Keeps the state of the visit." },
  ],
};

const targeting: CookieCategory = {
  id: "targeting",
  title: "Targeting cookies",
  description:
    "These cookies are set by our advertising partners to measure our campaigns and show you relevant ads on other platforms, such as Instagram and Facebook.",
  cookies: [{ name: "_fbp", provider: "Meta", type: "First-party", retention: "3 months", purpose: "Measures and delivers ads on Meta platforms." }],
};

export const COOKIE_CATEGORIES: CookieCategory[] = [
  necessary,
  ...(GA_ID ? [performance] : []),
  ...(META_PIXEL_ID ? [targeting] : []),
];

export const OPTIONAL_CATEGORIES = COOKIE_CATEGORIES.filter((c) => c.id !== "necessary").map((c) => c.id as OptionalCategory);

/** Cookies a borrar si el visitante retira el permiso de una categoría. */
export const CATEGORY_COOKIE_PREFIXES: Record<OptionalCategory, string[]> = {
  performance: ["_ga", "_gid"],
  targeting: ["_fbp", "_fbc"],
};
