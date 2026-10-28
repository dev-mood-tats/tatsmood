/** `object-position` con el centro de interés de la foto (marcado en WordPress → Medios). */
export const objectPosition = (img: { focal?: [number, number] | null } | null | undefined) =>
  img?.focal ? `${img.focal[0]}% ${img.focal[1]}%` : undefined;
