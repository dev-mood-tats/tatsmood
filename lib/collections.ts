// Plantillas de fila del lookbook de las colecciones. En WordPress Tat elige una por fila
// (mu-plugins/tatsmood-content.php). En escritorio todas las filas ocupan el mismo ancho
// (el del contenedor .lookbook, 64% de la pantalla y centrado) y las fotos se reparten ese
// ancho en columnas con estas proporciones, con 15px entre ellas. En móvil van una debajo
// de otra a todo el ancho.

export const LOOKBOOK_LAYOUTS: Record<string, number[]> = {
  "grande-pequena": [5, 3],
  "pequena-grande": [3, 5],
  centrada: [1],
  ancha: [1],
  "dos-pequenas": [1, 1],
  // De la primera versión; ahora igual que «dos-pequenas».
  "dos-medianas": [1, 1],
  tres: [1, 1, 1],
};

/**
 * Filas de una sola foto: más estrechas que el lookbook y centradas, con el mismo ancho que
 * tenían antes en pantalla (en % del ancho del lookbook): «centrada» ≈ 39% de la pantalla
 * y «ancha» ≈ 47%.
 */
export const LOOKBOOK_ROW_WIDTH: Record<string, number> = { centrada: 61.6, ancha: 74 };

/** Ancho del lookbook en escritorio, en % de la pantalla (para pedir fotos del tamaño justo). */
export const LOOKBOOK_WIDTH_VW = 64;

/** Proporción (ancho / alto) de los recortes que se pueden elegir en WordPress. */
export const CROP_RATIOS: Record<string, number> = { "4:3": 4 / 3, "1:1": 1, "4:5": 4 / 5 };
