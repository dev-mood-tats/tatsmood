import type { NextConfig } from "next";

// Imágenes: las sirve WordPress tal cual. WordPress las guarda en WebP al 90 % y en varios
// tamaños al subirlas (mu-plugin tatsmood-images.php) y la web solo elige el tamaño con
// srcset (components/WPImage.tsx). Next.js no redimensiona nada.

// Dominio de WordPress (para las redirecciones de /wp-content y /wp-admin).
// Se guarda en el entorno para que todos los procesos del build usen el mismo valor.
process.env.NEXT_DEPLOYMENT_ID ||= `build-${Date.now()}`;

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
  // Identificador de cada despliegue (se fija al hacer el build). Si alguien tiene la web
  // abierta mientras se publica una versión nueva, al navegar Next.js detecta que su página
  // es de la versión anterior y la recarga entera, en vez de pedir archivos que ya no
  // existen y acabar en «Something went wrong».
  deploymentId: process.env.NEXT_DEPLOYMENT_ID,
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // En el build, pocos procesos a la vez: el MySQL compartido de Hostinger
    // limita las conexiones y con 22 workers WordPress responde «Error establishing
    // a database connection». Si una página falla, se reintenta.
    cpus: 2,
    staticGenerationMaxConcurrency: 4,
    staticGenerationRetryCount: 3,
  },
  images: {
    // Sin optimizador de imágenes (ver arriba).
    unoptimized: true,
  },
};

export default nextConfig;
