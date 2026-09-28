// Separadores verticales compartidos por las vistas de planes (detalle /planes/[orderId] y lista /planes).
// Son clases completas (Tailwind solo genera las que aparecen literales en el código).

// Línea vertical gris claro a la izquierda de una columna, al 80 % de su alto y centrada. Es un borde (no
// un bloque de 1px con fondo): el navegador redondea el grosor de los bordes a píxeles enteros de pantalla, así
// que con escalado de pantalla (p. ej. 125 %) todas las líneas quedan iguales sin importar dónde caen.
export const DIVIDER =
    'relative before:absolute before:left-0 before:top-[10%] before:h-[80%] before:w-0 before:border-l before:border-zinc-200'
// El mismo separador, solo desde sm.
export const DIVIDER_SM =
    'sm:relative sm:before:absolute sm:before:left-0 sm:before:top-[10%] sm:before:h-[80%] sm:before:w-0 sm:before:border-l sm:before:border-zinc-200'
// El mismo separador, solo desde md.
export const DIVIDER_MD =
    'md:relative md:before:absolute md:before:left-0 md:before:top-[10%] md:before:h-[80%] md:before:w-0 md:before:border-l md:before:border-zinc-200'

// Columnas de los 4 macronutrientes: 2×2 en móvil y 4 en fila desde sm, sin gap horizontal (el padding
// de cada columna deja el separador al medio). El separador va solo entre columnas vecinas en la misma
// fila: la 3.ª (Carbohidratos) abre la segunda fila en móvil, así que lo lleva desde sm.
export const MACRO_COLUMN_CLASSES = [
    'pr-4',
    `pl-4 sm:pr-4 ${DIVIDER}`,
    `pr-4 sm:pl-4 ${DIVIDER_SM}`,
    `pl-4 ${DIVIDER}`,
]
