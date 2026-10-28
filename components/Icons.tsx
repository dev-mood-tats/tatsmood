// Iconos SVG copiados tal cual de tatsmood.com (mismo trazo fino), con el color
// heredado del texto (currentColor) para que funcionen sobre fondos claros u oscuros.

type IconProps = { className?: string };

/** "+" de los desplegables (9×9). */
export function IconPlus({ className }: IconProps) {
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden className={className}>
      <path d="M4.78125 0H4.21875V4.21875H0V4.78125H4.21875V9H4.78125V4.78125H9V4.21875H4.78125V0Z" fill="currentColor" />
    </svg>
  );
}

/** "—" de los desplegables (9×1). */
export function IconMinus({ className }: IconProps) {
  return (
    <svg width="9" height="1" viewBox="0 0 9 1" fill="none" aria-hidden className={className}>
      <path d="M9 0H0V0.5625H9V0Z" fill="currentColor" />
    </svg>
  );
}

/** "X" de cerrar (10×10). */
export function IconClose({ className }: IconProps) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden className={className}>
      <path
        d="M0.405995 10L5 5.40599L9.594 10L10 9.594L5.40599 5L10 0.405995L9.594 0L5 4.594L0.405995 0L0 0.405995L4.594 5L0 9.594L0.405995 10Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Icono de menú de móvil, dos rayas (10×5). */
export function IconMenu({ className }: IconProps) {
  return (
    <svg width="10" height="5" viewBox="0 0 10 5" fill="none" aria-hidden className={className}>
      <path d="M10 0H0V0.568113H10V0Z" fill="currentColor" />
      <path d="M10 4.14355H0V4.71167H10V4.14355Z" fill="currentColor" />
    </svg>
  );
}

/** Flecha fina hacia abajo de los desplegables (la misma del checkout). */
export function IconChevronDown({ className }: IconProps) {
  return (
    <svg width="12" height="7" viewBox="0 0 34 19" fill="none" aria-hidden className={className}>
      <path d="M16.707 15.293L1.414 0L0 1.414L16.707 18.121L33.414 1.414L32 0L16.707 15.293Z" fill="currentColor" />
    </svg>
  );
}
