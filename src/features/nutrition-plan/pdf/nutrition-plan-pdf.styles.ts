import { StyleSheet } from '@react-pdf/renderer'

// ============================================================
// PALETA Y MEDIDAS BASE
// Todo el "look" del PDF sale de estas pocas variables.
// Cambia estos valores para re-tematizar el documento entero
// sin tocar el resto de los estilos.
// ============================================================
export const palette = {
    primary: '#01b49c',       // color de marca (igual a --color-primary en globals.css)
    primarySoft: '#d0f4ee',   // primary aclarado: fondo suave para bloques destacados (aporte nutricional, etc)
    text: '#1f2937',          // gris oscuro para texto principal
    textDark: '#0f172a',      // casi negro, para el título grande de la portada
    textSoft: '#6b7280',      // gris medio para textos secundarios / labels
    border: '#e5e7eb',        // gris claro para líneas divisorias
    alternateBackground: '#f9fafb', // fondo gris muy claro (filas alternadas, tarjetas)
    background: '#f8fafb',    // fondo general de cada página del documento (igual a --color-sesion-background)
    darkBackground: '#e8f4f2', // primary muy aclarado: fondo un poco más oscuro (badges sobre tarjetas claras)
    cardBackground: '#fbfdfd', // punto medio entre blanco y fondo (aporte nutricional)
    white: '#ffffff',
    // -------- Acentos usados en la portada (macros + formas decorativas) --------
    accent: '#f4a261',        // naranja (carbohidratos)
    accentSoft: '#fde3cf',
    accentDark: '#ab7144',    // variante oscurecida, para íconos sin badge
    yellow: '#eab308',        // (grasas)
    yellowSoft: '#fef3c7',
    yellowDark: '#a47d06',    // variante oscurecida, para íconos sin badge
    blue: '#38bdf8',          // (energía)
    blueSoft: '#dbeafe',
    blueDark: '#2784ae',      // variante oscurecida, para íconos sin badge
    primaryDark: '#017867',   // primary oscurecido, para íconos sin badge
}

const spacing = {
    pageX: 40, // padding horizontal de cada página
    pageY: 36, // padding vertical de cada página
}

export const styles = StyleSheet.create({
    // -------- Página --------
    page: {
        paddingHorizontal: spacing.pageX,
        paddingVertical: spacing.pageY,
        fontSize: 10,
        color: palette.text,
        fontFamily: 'Helvetica', // fuente estándar embebida, no requiere Font.register
        backgroundColor: palette.background,
        position: 'relative', // ancla la <PageDecoration /> absoluta
    },

    // -------- Encabezado de cada página --------
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: palette.primary,
    },
    headerBrand: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        color: palette.primary,
    },
    headerSubtitle: {
        fontSize: 9,
        color: palette.textSoft,
    },

    // -------- Pie de página (numeración) --------
    pageFooter: {
        position: 'absolute',
        bottom: 16,
        left: spacing.pageX,
        right: spacing.pageX,
        textAlign: 'center',
        fontSize: 8,
        color: palette.textSoft,
    },

    // -------- Títulos de sección --------
    // color base (primary) queda para el bullet " · " + la hora; el valor
    // de "time" se sobreescribe con pageTitleTimeValue (oscuro).
    pageTitle: {
        fontSize: 20,
        fontFamily: 'Helvetica',
        color: palette.primary,
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    pageTitleTimeValue: {
        color: palette.textDark,
    },
    // Título de dos líneas, mismo espíritu que coverTitle/coverSubtitle
    // de la página 1 (línea negra tipo párrafo + línea de acento primary),
    // pero a escala de título de sección, no de portada.
    pageTitleDoubleContainer: {
        marginBottom: 16,
    },
    pageTitleDoubleText: {
        fontSize: 20,
        fontFamily: 'Helvetica',
        color: palette.textDark,
    },
    pageTitleDoubleAccent: {
        fontSize: 20,
        fontFamily: 'Helvetica-Bold',
        color: palette.primary,
        marginTop: 2,
    },
    sectionTitle: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        color: palette.text,
        marginBottom: 6,
        marginTop: 14,
    },
    sectionLine: {
        width: 40,
        height: 2,
        backgroundColor: palette.primary,
        marginTop: 0,
        marginBottom: 8,
    },

    // -------- Tarjeta / bloque genérico con borde --------
    card: {
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: 6,
        padding: 12,
        marginBottom: 16,
    },


    // -------- Bloque de aporte nutricional (macros destacados) --------
    nutritionalIntakeContainer: {
        position: 'relative',
        marginTop: 6,
        marginBottom: 10,
        borderWidth: 1,
        borderRadius: 8,
        borderColor: palette.border,
    },
    // react-pdf no soporta boxShadow nativo: dos capas sutiles detrás de la
    // tarjeta (una un poco más grande y más transparente que la otra) para
    // dar un pelín más de difuminado sin perder la sutileza.
    nutritionalIntakeDiffuseShadow: {
        position: 'absolute',
        top: 3,
        left: -2,
        right: -2,
        bottom: -4,
        borderRadius: 16,
        backgroundColor: palette.textSoft,
        opacity: 0.06,
    },
    nutritionalIntakeShadow: {
        position: 'absolute',
        top: 2,
        left: 0,
        right: 0,
        bottom: -2,
        borderRadius: 16,
        backgroundColor: palette.textSoft,
        opacity: 0.12,
    },
    // radio calcado de coverCard (info del paciente)
    nutritionalIntake: {
        flexDirection: 'row',
        borderRadius: 8,
        overflow: 'hidden',
        // fondo "de respaldo": si el layout deja un hueco de redondeo de
        // subpíxel entre dos items contiguos, se ve del mismo color (se funde
        // con los items) en vez de dejar pasar el fondo de la página
        // (palette.background), que es lo que se veía como una línea de 100% de alto.
        backgroundColor: palette.cardBackground,
    },
    // opacity va en cada item (no en el contenedor): aplicada al contenedor,
    // react-pdf compone toda la fila (incluido el divisor) como un solo grupo
    // semitransparente recortado, y eso deja una costura de 100% de alto
    // justo en el borde compartido entre dos items contiguos.
    intakeItem: {
        flex: 1,
        backgroundColor: palette.cardBackground,
        paddingVertical: 20,
        alignItems: 'center',
        // opacity: 0.4,
    },
    // línea divisoria entre items: no puede ser un borderLeft (esos siempre
    // ocupan el 100% del alto), por eso es un elemento aparte centrado.
    intakeDivider: {
        width: 1,
        height: '60%',
        alignSelf: 'center',
        backgroundColor: palette.border,
    },
    intakeValue: {
        fontSize: 13,
        fontFamily: 'Helvetica-Bold',
        color: palette.primary,
    },
    intakeLabel: {
        fontSize: 7,
        color: palette.text,
        textTransform: 'uppercase',
        marginTop: 6,
    },
    intakeLine: {
        width: '25%',
        height: 2,
        backgroundColor: palette.primary,
        marginTop: 10,
    },

    // -------- Listas simples (alimentos, ejemplos, comentarios) --------
    listRow: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    // separador entre ejemplos (todos menos el último)
    listRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
        paddingBottom: 6,
    },
    listBullet: {
        width: 10,
        fontSize: 10,
        color: palette.primary,
    },
    listText: {
        flex: 1,
        fontSize: 10,
        lineHeight: 1.4,
    },
    listTextLabel: {
        fontFamily: 'Helvetica-Bold',
    },

    // -------- Tabla de alimentos por porciones (dentro de cada tiempo de comida) --------
    // el padding vertical vive en cada celda (foodsTableCell), no en la
    // fila: así el borderLeft de la celda de Equivalencia llega de borde a
    // borde de la fila, en vez de dejar un hueco arriba/abajo por el padding
    // de la fila (el borde queda "adentro" del padding del padre).
    foodsTableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
    },
    foodsTableRowNoBorder: {
        borderBottomWidth: 0,
    },
    foodsTableCell: {
        paddingVertical: 6,
    },
    // borde inferior más grueso que el de las filas normales (mismo color
    // gris que las demás), para que se note más sin cambiar de paleta.
    foodsTableRowHeader: {
        flexDirection: 'row',
        borderBottomWidth: 2,
        borderBottomColor: palette.border,
        paddingBottom: 6,
        marginBottom: 6,
        fontSize: 10,
        fontFamily: 'Helvetica',
        color: palette.primary,
        textTransform: 'uppercase',
    },
    foodsTableGroupCol: { width: '25%', paddingHorizontal: 4 },
    foodsTablePortionsCol: { width: '25%', paddingHorizontal: 4 },
    foodsTableEquivalenceCol: { width: '50%', paddingHorizontal: 4 },
    // línea vertical solo en las filas de datos (no en el header)
    foodsTableEquivalenceColBorder: {
        borderLeftWidth: 1,
        borderLeftColor: palette.border,
    },

    // -------- Tabla resumen (página 2) --------
    // cada fila es un card independiente (en vez de una fila con línea inferior)
    summaryTableRow: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: 8,
        backgroundColor: palette.cardBackground,
        paddingVertical: 10,
        paddingHorizontal: 8,
        marginBottom: 10,
    },
    summaryTableRowHeader: {
        flexDirection: 'row',
        backgroundColor: palette.primary,
        borderRadius: 4,
        paddingVertical: 6,
        marginBottom: 10,
    },
    summaryTableTimeCol: { width: '30%', paddingLeft: 8 },
    summaryTableTimeColRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    summaryTableTimeIconBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: palette.darkBackground,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    summaryTableFoodsCol: { width: '40%', paddingHorizontal: 4 },
    summaryTableMacrosCol: { width: '30%', paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center' },
    // borderLeft siempre ocupa el 100% del alto; para que la línea sea más
    // corta hace falta un elemento aparte, centrado verticalmente. Alto fijo
    // en puntos (no '%'): con 3 niveles de fila anidados (summaryTableRow >
    // summaryTableMacrosCol > summaryTableMacrosSubCol, todos de alto automático) el % no
    // tenía una base definida contra la cual resolverse y terminaba en 0.
    summaryTableMacrosSubCol: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    summaryTableMacrosLine: { width: 1, height: 66, backgroundColor: palette.border, marginRight: 6 },
    summaryTableHeaderText: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: palette.white,
        textTransform: 'uppercase',
    },
    summaryTableMealText: {
        fontSize: 10,
        lineHeight: 1.4,
        color: palette.primary,
        textTransform: 'uppercase',
        fontWeight: 600,
    },
    summaryTableMacrosText: {
        fontSize: 10,
        lineHeight: 1.4,
        marginBottom: 6,
        marginLeft: 2,
    },
    summaryTableText: {
        fontSize: 10,
        lineHeight: 1.4,
        marginBottom: 2,
    },
    summaryTableFoodRow: {
        flexDirection: 'row',
    },
    summaryTableTextBullet: {
        color: palette.primary,
        marginRight: 4,
    },

    // -------- Suplementos / recomendaciones (última página) --------
    // mismo lenguaje de card que summaryTableRow/nutritionalIntake: borde + radio +
    // cardBackground, en vez del alternateBackground plano que tenía antes.
    highlightedItem: {
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: 8,
        backgroundColor: palette.cardBackground,
        padding: 12,
        marginBottom: 10,
    },
    highlightedItemTitle: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        color: palette.primary,
        marginBottom: 2,
    },
    highlightedItemSubtitle: {
        fontSize: 8.5,
        color: palette.textSoft,
        lineHeight: 1.4,
        marginBottom: 8,
    },
    // etiqueta pequeña en mayúscula, mismo patrón que coverFieldLabel / foodsTableRowHeader
    highlightedItemLabel: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: palette.text,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 6,
        marginBottom: 3,
    },
    highlightedItemText: {
        fontSize: 9,
        lineHeight: 1.4,
        color: palette.text,
    },

    // ============================================================
    // PORTADA (página 1) — inspirada en el diseño de marca FITPLAN
    // ============================================================
    coverPage: {
        paddingHorizontal: spacing.pageX,
        paddingVertical: spacing.pageY,
        fontSize: 10,
        color: palette.text,
        fontFamily: 'Helvetica',
        position: 'relative',
        backgroundColor: palette.background,
    },
    // Ancho/alto fijos en puntos (medida real de una página A4) en vez de
    // porcentajes: con position:'absolute' + height:'100%' react-pdf calcula
    // mal el espacio disponible y termina paginando el resto del contenido
    // a una página aparte. Con medidas fijas no participa de ese cálculo.
    // top/left en 0 (no negativos): position:'absolute' en react-pdf/Yoga se
    // posiciona respecto al borde exterior del padre, ignorando el padding
    // de este último, así que 0 ya coincide con el borde real de la página.
    coverDecoration: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 595.28,
        height: 841.89,
    },
    coverLeftBar: {
        position: 'absolute',
        top: 0,
        left: 10,
        width: 5,
        height: 105,
        backgroundColor: palette.primary,
    },

    // -------- Marca --------
    coverBrand: {
        marginBottom: 40,
    },
    coverLogo: {
        fontSize: 28,
        fontFamily: 'Helvetica',
        color: palette.primary,
        letterSpacing: 5,
        marginTop: '20px',
    },
    coverLogoSubtitle: {
        fontSize: 8,
        color: palette.textSoft,
        letterSpacing: 2,
        marginTop: 6,
    },

    // -------- Título principal --------
    coverTitleContainer: {
        marginBottom: 40,
    },
    coverTitle: {
        fontSize: 50,
        fontFamily: 'Helvetica-Bold',
        color: palette.textDark,
        lineHeight: 1.15,
    },
    coverSubtitle: {
        fontSize: 35,
        fontFamily: 'Helvetica',
        color: palette.primary,
        marginTop: 2,
    },
    coverLine: {
        width: 40,
        height: 2,
        backgroundColor: palette.primary,
        marginTop: 14,
        marginBottom: 10,
    },
    coverTagline: {
        fontSize: 9,
        color: palette.textSoft,
        lineHeight: 1.6,
        letterSpacing: 0.5,
    },

    // -------- Título de sección (info paciente / prescripción) --------
    coverSectionTitle: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: palette.primary,
        letterSpacing: 1,
        marginBottom: 10,
    },
    coverSectionTitleLine: {
        width: 50,
        height: 1,
        backgroundColor: palette.border,
        marginTop: -4,
        marginBottom: 10,
    },

    // -------- Tarjeta "Información del paciente" --------
    // el marginBottom vive acá (no en coverCard cuando se usa como
    // tarjeta exterior): en Yoga, a diferencia de CSS, el margen de un hijo
    // en flujo SÍ se suma al alto auto-calculado del contenedor, así que si
    // quedara en la tarjeta, la sombra (posicionada con top/bottom relativos
    // a ese alto inflado) se ve como un bloque gris separado más abajo.
    coverCardContainer: {
        position: 'relative',
        marginBottom: 30,
    },
    coverCard: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 12,
        marginBottom: 26,
        backgroundColor: palette.cardBackground,
    },
    coverField: {
        flex: 1,
        paddingHorizontal: 12,
        borderLeftWidth: 1,
        borderLeftColor: palette.border,
    },
    coverFieldFirst: {
        borderLeftWidth: 0,
    },
    coverFieldIconRow: {
        marginBottom: 8,
    },
    coverFieldLabel: {
        fontSize: 8,
        fontFamily: 'Helvetica',
        color: palette.textSoft,
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    coverFieldValue: {
        fontSize: 10,
        fontFamily: 'Helvetica',
        color: palette.text,
    },

    // -------- Prescripción: régimen/objetivo + macros --------
    coverPrescriptionLine: {
        width: '100%',
        height: 1,
        backgroundColor: palette.border,
        marginBottom: 14,
    },
    coverPrescription: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },
    coverPrescriptionInfo: {
        width: '30%',
        paddingRight: 10,
    },
    coverIconBadge: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: palette.alternateBackground,
        alignItems: 'center',
        justifyContent: 'center',
    },
    coverIconTextItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    coverIconTextBlock: {
        marginLeft: 8,
        flex: 1,
    },
    coverItemLabel: {
        fontSize: 8,
        fontFamily: 'Helvetica',
        color: palette.textSoft,
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    coverItemValue: {
        fontSize: 10,
        fontFamily: 'Helvetica',
        color: palette.text,
    },
    coverMacros: {
        flexDirection: 'row',
        flex: 1,
        justifyContent: 'space-between',
    },
    coverMacroItem: {
        alignItems: 'center',
        width: '24%',
        borderLeftWidth: 1,
        borderLeftColor: palette.border,
        paddingLeft: 8,
    },
    coverMacroLabel: {
        fontSize: 6,
        fontFamily: 'Helvetica',
        color: palette.textSoft,
        letterSpacing: 0.5,
        marginTop: 10,
    },
    coverMacroValue: {
        fontSize: 19,
        fontFamily: 'Helvetica',
        color: palette.textDark,
        marginTop: 4,
    },
    coverMacroUnit: {
        fontSize: 8,
        color: palette.textSoft,
        marginTop: 4,
    },

    // -------- Pie de portada --------
    coverFooter: {
        position: 'absolute',
        bottom: 44,
        left: spacing.pageX,
    },
    coverFooterText: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: palette.text,
        lineHeight: 1.4,
    },
    coverFooterLine: {
        width: 30,
        height: 2,
        backgroundColor: palette.primary,
        marginTop: 8,
    },
})
