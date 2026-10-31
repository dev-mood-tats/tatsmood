import type { NextConfig } from "next";

// Imágenes "a lo Next.js": WordPress guarda solo el original y Next.js genera bajo demanda
// cada tamaño que pide la web, en WebP y siempre al 85 % de calidad, y lo guarda en caché
// (.next/cache/images). Para vaciar la caché basta con borrar esa carpeta.
const IMAGE_QUALITY = 85;

// Dominio desde el que se sirven las imágenes de WordPress (wp-content/uploads).
const wpUrl = new URL(process.env.WOOCOMMERCE_URL || "http://tatsmood.local");

const nextConfig: NextConfig = {
  // URLs antiguas → nuevas (permanentes, para no perder posicionamiento ni enlaces compartidos):
  // las de la primera versión en español y las de la web en WordPress/Elementor.
  async redirects() {
    return [
      { source: "/tienda", destination: "/store", permanent: true },
      { source: "/tienda/:category", destination: "/store/:category", permanent: true },
      { source: "/producto/:slug", destination: "/product/:slug", permanent: true },
      { source: "/collections/tag-:slug", destination: "/:slug", permanent: true },
      { source: "/collection/:slug", destination: "/:slug", permanent: true },
      { source: "/pedido/gracias", destination: "/order/thank-you", permanent: true },
      { source: "/pedido/error", destination: "/order/error", permanent: true },
      { source: "/politica-de-cookies-ue", destination: "/cookie-policy", permanent: true },
      { source: "/shop", destination: "/store", permanent: true },
      { source: "/cart", destination: "/", permanent: true },
      // WordPress vive en su propio (sub)dominio (WOOCOMMERCE_URL). Lo que antes estaba en
      // tatsmood.com se manda allí: las fotos (enlazadas desde Google Imágenes o correos ya
      // enviados) y el escritorio de WordPress, para quien entre por costumbre.
      { source: "/wp-content/:path*", destination: `${wpUrl.origin}/wp-content/:path*`, permanent: true },
      { source: "/wp-admin", destination: `${wpUrl.origin}/wp-admin/`, permanent: false },
      { source: "/wp-admin/:path*", destination: `${wpUrl.origin}/wp-admin/:path*`, permanent: false },
      { source: "/wp-login.php", destination: `${wpUrl.origin}/wp-login.php`, permanent: false },
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    // Solo se permite una calidad: cualquier <Image> se sirve al 85 %.
    qualities: [IMAGE_QUALITY],
    formats: ["image/webp"],
    // Anchos que puede generar Next. Hasta 3200 px: las fotos de cabecera en móvil se
    // recortan mucho (una foto apaisada en una caja vertical se ve 3-4 veces más ancha que
    // la pantalla) y en pantallas de alta densidad necesitan ese ancho para verse nítidas.
    // Next nunca agranda una foto por encima de su tamaño original.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 2560, 3200],
    // Una vez generada, cada versión se reutiliza durante 30 días.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: wpUrl.protocol.replace(":", "") as "http" | "https",
        hostname: wpUrl.hostname,
        port: wpUrl.port,
        pathname: "/wp-content/uploads/**",
      },
    ],
    // tatsmood.local (LocalWP) apunta a una IP local, que Next.js bloquea por seguridad.
    // Solo se permite mientras WordPress sea el local (.local), también al probar el build
    // con "npm start"; con el WordPress real (dominio público) queda desactivado solo.
    dangerouslyAllowLocalIP: wpUrl.hostname.endsWith(".local"),
  },
};

export default nextConfig;
