/**
 * Bloquea el scroll de la página mientras hay un panel abierto (carrito, menú, cookies).
 *
 * Solo en ordenador (ratón o trackpad). En móvil NO se toca el `overflow` del body: en
 * Instagram, Brave, Firefox, Ecosia… (navegadores con la barra de direcciones fija arriba o
 * abajo), cambiarlo con la página desplazada hacía que la cabecera fija se quedara despegada,
 * flotando a media pantalla. En móvil, los propios paneles evitan que se mueva la página:
 * el velo no admite gestos (`touch-none`) y las zonas con scroll no lo pasan a la página
 * (`overscroll-contain`).
 *
 * Devuelve la función que lo desbloquea.
 */
export function lockPageScroll(): () => void {
  if (typeof window === "undefined" || !window.matchMedia("(pointer: fine)").matches) return () => {};
  const previous = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  return () => {
    document.body.style.overflow = previous;
  };
}
