// Configuración del backend WordPress/WooCommerce.
// Solo se usa en el servidor: estas variables NO llevan el prefijo NEXT_PUBLIC_,
// así que nunca llegan al navegador.

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Revisa el archivo .env.local (tienes un ejemplo en .env.local.example).`,
    );
  }
  return value;
}

export function getWooConfig() {
  return {
    // URL de la home de WordPress, sin barra final. Ej: http://tatsmood.local
    url: required("WOOCOMMERCE_URL").replace(/\/+$/, ""),
    consumerKey: required("WOOCOMMERCE_CONSUMER_KEY"),
    consumerSecret: required("WOOCOMMERCE_CONSUMER_SECRET"),
  };
}
