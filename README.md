# tatsmood — web en Next.js

Frontend de tatsmood.com. La tienda y los contenidos viven en WordPress/WooCommerce
(`../tatsmood-wp`) y esta web los lee por API. El checkout y el pago siguen en WooCommerce
(tema `tatsmood-headless`).

## Arrancar en local

1. Arranca el sitio «tatsmood» en LocalWP (http://tatsmood.local).
2. Copia `.env.local.example` a `.env.local` y rellena las variables.
3. `npm install` y `npm run dev` → http://localhost:3000

Para probar la versión rápida (como en producción): `npm run build` y `npm start`.

## Rutas

| Ruta | Qué es |
| --- | --- |
| `/` | Home: colecciones elegidas en «Web tatsmood», Featured y final de la home |
| `/store`, `/store/[category]` | Tienda y tienda filtrada por tipo |
| `/product/[slug]` | Ficha de producto |
| `/[collection]` | Página de colección (`/yolo`, `/gracias`…) |
| `/faqs`, `/legal-notice`, `/privacy-policy`, `/cookie-policy` | Páginas de texto de WordPress |
| `/order/thank-you`, `/order/error` | Final de la compra (vienen de WooCommerce) |
| `/checkout` | Redirige al checkout de WooCommerce con el carrito |
| `/api/revalidate` | Avisos de WordPress/WooCommerce para refrescar la caché |

Las URLs antiguas (`/tienda`, `/producto/…`, `/collection/…`) redirigen a las nuevas
(`next.config.ts`).

## Dónde se edita cada cosa (WordPress)

- **Productos, tipos y colecciones**: Productos (WooCommerce), Productos → Categorías y
  Productos → Collections (foto de cabecera, fecha, lookbook visual, foto de la home).
- **Home** (colecciones, Featured, texto y foto del final): menú «Web tatsmood».
- **Menús** (Type, Collections, redes, footer): Apariencia → Menús.
- **Textos** (FAQs, Legal notice, Privacy policy, Cookie policy): Páginas.
- **Centro de interés de las fotos**: Medios → abrir la foto → pulsar sobre la zona.

El código de WordPress que da todo esto está en `wp-content/mu-plugins/tatsmood-content.php`
y `tatsmood-headless.php`.

## SEO

Automático: títulos «Página – tatsmood», descripciones e imágenes para redes a partir del
contenido (`lib/seo.ts`), datos estructurados de producto, `sitemap.xml` y `robots.txt`.

## Cookies

Banner propio (`components/CookieBanner.tsx`), con el diseño del de la web anterior. Guarda la
elección en la cookie `tm_consent` (`lib/consent.ts`). Un enlace a `#cookie-settings` lo vuelve
a abrir.
