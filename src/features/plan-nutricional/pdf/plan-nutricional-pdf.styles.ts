import { StyleSheet } from '@react-pdf/renderer'

// ============================================================
// PALETA Y MEDIDAS BASE
// Todo el "look" del PDF sale de estas pocas variables.
// Cambia estos valores para re-tematizar el documento entero
// sin tocar el resto de los estilos.
// ============================================================
export const paleta = {
    primario: '#10b968',       // color de marca (igual a --color-primary en globals.css)
    primarioSuave: '#beffe0',  // fondo suave para bloques destacados (aporte nutricional, etc)
    texto: '#1f2937',          // gris oscuro para texto principal
    textoOscuro: '#0f172a',    // casi negro, para el título grande de la portada
    textoSuave: '#6b7280',     // gris medio para textos secundarios / labels
    borde: '#e5e7eb',          // gris claro para líneas divisorias
    fondoAlterno: '#f9fafb',   // fondo gris muy claro (filas alternadas, tarjetas)
    fondo: '#fcf9f4',          // fondo general de cada página del documento
    fondoOscuro: '#f0ede8',    // variante un poco más oscura de fondo (badges sobre tarjetas claras)
    fondoTarjeta: '#fffbf6',   // punto medio entre blanco y fondo (aporte nutricional)
    blanco: '#ffffff',
    // -------- Acentos usados en la portada (macros + formas decorativas) --------
    acento: '#f4a261',         // naranja (carbohidratos)
    acentoSuave: '#fde3cf',
    acentoOscuro: '#ab7144',   // variante oscurecida, para íconos sin badge
    amarillo: '#eab308',       // (grasas)
    amarilloSuave: '#fef3c7',
    amarilloOscuro: '#a47d06', // variante oscurecida, para íconos sin badge
    azul: '#38bdf8',           // (energía)
    azulSuave: '#dbeafe',
    azulOscuro: '#2784ae',     // variante oscurecida, para íconos sin badge
    primarioOscuro: '#0b8249', // variante oscurecida, para íconos sin badge
}

const espaciado = {
    paginaX: 40, // padding horizontal de cada página
    paginaY: 36, // padding vertical de cada página
}

export const styles = StyleSheet.create({
    // -------- Página --------
    page: {
        paddingHorizontal: espaciado.paginaX,
        paddingVertical: espaciado.paginaY,
        fontSize: 10,
        color: paleta.texto,
        fontFamily: 'Helvetica', // fuente estándar embebida, no requiere Font.register
        backgroundColor: paleta.fondo,
        position: 'relative', // ancla la <DecoracionPagina /> absoluta
    },

    // -------- Encabezado de cada página --------
    encabezado: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: paleta.primario,
    },
    encabezadoMarca: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        color: paleta.primario,
    },
    encabezadoSubtitulo: {
        fontSize: 9,
        color: paleta.textoSuave,
    },

    // -------- Pie de página (numeración) --------
    piePagina: {
        position: 'absolute',
        bottom: 16,
        left: espaciado.paginaX,
        right: espaciado.paginaX,
        textAlign: 'center',
        fontSize: 8,
        color: paleta.textoSuave,
    },

    // -------- Títulos de sección --------
    // color base (primario) queda para el bullet " · " + la hora; el valor
    // de "tiempo" se sobreescribe con tituloPaginaTiempoValor (oscuro).
    tituloPagina: {
        fontSize: 20,
        fontFamily: 'Helvetica',
        color: paleta.primario,
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    tituloPaginaTiempoValor: {
        color: paleta.textoOscuro,
    },
    // Título de dos líneas, mismo espíritu que portadaTitulo/portadaSubtitulo
    // de la página 1 (línea negra tipo párrafo + línea de acento primario),
    // pero a escala de título de sección, no de portada.
    tituloPaginaDobleContenedor: {
        marginBottom: 16,
    },
    tituloPaginaDobleTexto: {
        fontSize: 20,
        fontFamily: 'Helvetica',
        color: paleta.textoOscuro,
    },
    tituloPaginaDobleAcento: {
        fontSize: 20,
        fontFamily: 'Helvetica-Bold',
        color: paleta.primario,
        marginTop: 2,
    },
    tituloSeccion: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        color: paleta.texto,
        marginBottom: 6,
        marginTop: 14,
    },
    seccionLinea: {
        width: 40,
        height: 2,
        backgroundColor: paleta.primario,
        marginTop: 0,
        marginBottom: 8,
    },

    // -------- Tarjeta / bloque genérico con borde --------
    tarjeta: {
        borderWidth: 1,
        borderColor: paleta.borde,
        borderRadius: 6,
        padding: 12,
        marginBottom: 16,
    },


    // -------- Bloque de aporte nutricional (macros destacados) --------
    aporteNutricionalContenedor: {
        position: 'relative',
        marginTop: 6,
        marginBottom: 10,
        borderWidth: 1,
        borderRadius: 8,
        borderColor: paleta.borde,
    },
    // react-pdf no soporta boxShadow nativo: dos capas sutiles detrás de la
    // tarjeta (una un poco más grande y más transparente que la otra) para
    // dar un pelín más de difuminado sin perder la sutileza.
    aporteNutricionalSombraDifusa: {
        position: 'absolute',
        top: 3,
        left: -2,
        right: -2,
        bottom: -4,
        borderRadius: 16,
        backgroundColor: paleta.textoSuave,
        opacity: 0.06,
    },
    aporteNutricionalSombra: {
        position: 'absolute',
        top: 2,
        left: 0,
        right: 0,
        bottom: -2,
        borderRadius: 16,
        backgroundColor: paleta.textoSuave,
        opacity: 0.12,
    },
    // radio calcado de portadaTarjeta (info del paciente)
    aporteNutricional: {
        flexDirection: 'row',
        borderRadius: 8,
        overflow: 'hidden',
        // fondo "de respaldo": si el layout deja un hueco de redondeo de
        // subpíxel entre dos items contiguos, se ve del mismo color (se funde
        // con los items) en vez de dejar pasar el fondo de la página
        // (paleta.fondo), que es lo que se veía como una línea de 100% de alto.
        backgroundColor: paleta.fondoTarjeta,
    },
    // opacity va en cada item (no en el contenedor): aplicada al contenedor,
    // react-pdf compone toda la fila (incluido el divisor) como un solo grupo
    // semitransparente recortado, y eso deja una costura de 100% de alto
    // justo en el borde compartido entre dos items contiguos.
    aporteItem: {
        flex: 1,
        backgroundColor: paleta.fondoTarjeta,
        paddingVertical: 20,
        alignItems: 'center',
        // opacity: 0.4,
    },
    // línea divisoria entre items: no puede ser un borderLeft (esos siempre
    // ocupan el 100% del alto), por eso es un elemento aparte centrado.
    aporteDivisor: {
        width: 1,
        height: '60%',
        alignSelf: 'center',
        backgroundColor: paleta.borde,
    },
    aporteValor: {
        fontSize: 13,
        fontFamily: 'Helvetica-Bold',
        color: paleta.primario,
    },
    aporteLabel: {
        fontSize: 7,
        color: paleta.texto,
        textTransform: 'uppercase',
        marginTop: 6,
    },
    aporteLinea: {
        width: '25%',
        height: 2,
        backgroundColor: paleta.primario,
        marginTop: 10,
    },

    // -------- Listas simples (alimentos, ejemplos, comentarios) --------
    listaFila: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    // separador entre ejemplos (todos menos el último)
    listaFilaBorde: {
        borderBottomWidth: 1,
        borderBottomColor: paleta.borde,
        paddingBottom: 6,
    },
    listaBullet: {
        width: 10,
        fontSize: 10,
        color: paleta.primario,
    },
    listaTexto: {
        flex: 1,
        fontSize: 10,
        lineHeight: 1.4,
    },
    listaTextoLabel: {
        fontFamily: 'Helvetica-Bold',
    },

    // -------- Tabla de alimentos por porciones (dentro de cada tiempo de comida) --------
    // el padding vertical vive en cada celda (tablaAlimentosCelda), no en la
    // fila: así el borderLeft de la celda de Equivalencia llega de borde a
    // borde de la fila, en vez de dejar un hueco arriba/abajo por el padding
    // de la fila (el borde queda "adentro" del padding del padre).
    tablaAlimentosFila: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: paleta.borde,
    },
    tablaAlimentosFilaSinBorde: {
        borderBottomWidth: 0,
    },
    tablaAlimentosCelda: {
        paddingVertical: 6,
    },
    // borde inferior más grueso que el de las filas normales (mismo color
    // gris que las demás), para que se note más sin cambiar de paleta.
    tablaAlimentosFilaHeader: {
        flexDirection: 'row',
        borderBottomWidth: 2,
        borderBottomColor: paleta.borde,
        paddingBottom: 6,
        marginBottom: 6,
        fontSize: 10,
        fontFamily: 'Helvetica',
        color: paleta.primario,
        textTransform: 'uppercase',
    },
    tablaAlimentosColGrupo: { width: '20%', paddingHorizontal: 4 },
    tablaAlimentosColPorciones: { width: '40%', paddingHorizontal: 4 },
    tablaAlimentosColEquivalencia: { width: '40%', paddingHorizontal: 4 },
    // línea vertical solo en las filas de datos (no en el header)
    tablaAlimentosColEquivalenciaBorde: {
        borderLeftWidth: 1,
        borderLeftColor: paleta.borde,
    },

    // -------- Tabla resumen (página 2) --------
    // cada fila es un card independiente (en vez de una fila con línea inferior)
    tablaFila: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: paleta.borde,
        borderRadius: 8,
        backgroundColor: paleta.fondoTarjeta,
        paddingVertical: 10,
        paddingHorizontal: 8,
        marginBottom: 10,
    },
    tablaFilaHeader: {
        flexDirection: 'row',
        backgroundColor: paleta.primario,
        borderRadius: 4,
        paddingVertical: 6,
        marginBottom: 10,
    },
    tablaColTiempo: { width: '30%', paddingLeft: 8 },
    tablaColTiempoFila: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tablaColTiempoIconoBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: paleta.fondoOscuro,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    tablaColAlimentos: { width: '40%', paddingHorizontal: 4 },
    tablaColMacros: { width: '30%', paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center' },
    // borderLeft siempre ocupa el 100% del alto; para que la línea sea más
    // corta hace falta un elemento aparte, centrado verticalmente. Alto fijo
    // en puntos (no '%'): con 3 niveles de fila anidados (tablaFila >
    // tablaColMacros > tablaColMacrosSub, todos de alto automático) el % no
    // tenía una base definida contra la cual resolverse y terminaba en 0.
    tablaColMacrosSub: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    tablaColMacrosLinea: { width: 1, height: 66, backgroundColor: paleta.borde, marginRight: 6 },
    tablaHeaderTexto: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: paleta.blanco,
        textTransform: 'uppercase',
    },
    tablaTextoComida: {
        fontSize: 10,
        lineHeight: 1.4,
        color: paleta.primario,
        textTransform: 'uppercase',
        fontWeight: 600,
    },
    tablaTextoMacros: {
        fontSize: 10,
        lineHeight: 1.4,
        marginBottom: 6,
        marginLeft: 2,
    },
    tablaTexto: {
        fontSize: 10,
        lineHeight: 1.4,
        marginBottom: 2,
    },
    tablaAlimentoFila: {
        flexDirection: 'row',
    },
    tablaTextoBullet: {
        color: paleta.primario,
        marginRight: 4,
    },

    // -------- Suplementos / recomendaciones (última página) --------
    // mismo lenguaje de card que tablaFila/aporteNutricional: borde + radio +
    // fondoTarjeta, en vez del fondoAlterno plano que tenía antes.
    itemDestacado: {
        borderWidth: 1,
        borderColor: paleta.borde,
        borderRadius: 8,
        backgroundColor: paleta.fondoTarjeta,
        padding: 12,
        marginBottom: 10,
    },
    itemDestacadoTitulo: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        color: paleta.primario,
        marginBottom: 2,
    },
    itemDestacadoSubtitulo: {
        fontSize: 8.5,
        color: paleta.textoSuave,
        lineHeight: 1.4,
        marginBottom: 8,
    },
    // etiqueta pequeña en mayúscula, mismo patrón que portadaCampoLabel / tablaAlimentosFilaHeader
    itemDestacadoLabel: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: paleta.texto,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 6,
        marginBottom: 3,
    },
    itemDestacadoTexto: {
        fontSize: 9,
        lineHeight: 1.4,
        color: paleta.texto,
    },

    // ============================================================
    // PORTADA (página 1) — inspirada en el diseño de marca NUVI
    // ============================================================
    paginaPortada: {
        paddingHorizontal: espaciado.paginaX,
        paddingVertical: espaciado.paginaY,
        fontSize: 10,
        color: paleta.texto,
        fontFamily: 'Helvetica',
        position: 'relative',
        backgroundColor: paleta.fondo,
    },
    // Ancho/alto fijos en puntos (medida real de una página A4) en vez de
    // porcentajes: con position:'absolute' + height:'100%' react-pdf calcula
    // mal el espacio disponible y termina paginando el resto del contenido
    // a una página aparte. Con medidas fijas no participa de ese cálculo.
    // top/left en 0 (no negativos): position:'absolute' en react-pdf/Yoga se
    // posiciona respecto al borde exterior del padre, ignorando el padding
    // de este último, así que 0 ya coincide con el borde real de la página.
    portadaDecoracion: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 595.28,
        height: 841.89,
    },
    portadaBarraIzquierda: {
        position: 'absolute',
        top: 0,
        left: 10,
        width: 5,
        height: 105,
        backgroundColor: paleta.primario,
    },

    // -------- Marca --------
    portadaMarca: {
        marginBottom: 40,
    },
    portadaLogo: {
        fontSize: 28,
        fontFamily: 'Helvetica',
        color: paleta.primario,
        letterSpacing: 5,
        marginTop: '20px',
    },
    portadaLogoSubtitulo: {
        fontSize: 8,
        color: paleta.textoSuave,
        letterSpacing: 2,
        marginTop: 6,
    },

    // -------- Título principal --------
    portadaTituloContenedor: {
        marginBottom: 40,
    },
    portadaTitulo: {
        fontSize: 50,
        fontFamily: 'Helvetica-Bold',
        color: paleta.textoOscuro,
        lineHeight: 1.15,
    },
    portadaSubtitulo: {
        fontSize: 35,
        fontFamily: 'Helvetica',
        color: paleta.primario,
        marginTop: 2,
    },
    portadaLinea: {
        width: 40,
        height: 2,
        backgroundColor: paleta.primario,
        marginTop: 14,
        marginBottom: 10,
    },
    portadaTagline: {
        fontSize: 9,
        color: paleta.textoSuave,
        lineHeight: 1.6,
        letterSpacing: 0.5,
    },

    // -------- Título de sección (info paciente / prescripción) --------
    portadaTituloSeccion: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: paleta.primario,
        letterSpacing: 1,
        marginBottom: 10,
    },
    portadaTituloSeccionLinea: {
        width: 50,
        height: 1,
        backgroundColor: paleta.borde,
        marginTop: -4,
        marginBottom: 10,
    },

    // -------- Tarjeta "Información del paciente" --------
    // el marginBottom vive acá (no en portadaTarjeta cuando se usa como
    // tarjeta exterior): en Yoga, a diferencia de CSS, el margen de un hijo
    // en flujo SÍ se suma al alto auto-calculado del contenedor, así que si
    // quedara en la tarjeta, la sombra (posicionada con top/bottom relativos
    // a ese alto inflado) se ve como un bloque gris separado más abajo.
    portadaTarjetaContenedor: {
        position: 'relative',
        marginBottom: 30,
    },
    portadaTarjeta: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: paleta.borde,
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 12,
        marginBottom: 26,
        backgroundColor: paleta.fondoTarjeta,
    },
    portadaCampo: {
        flex: 1,
        paddingHorizontal: 12,
        borderLeftWidth: 1,
        borderLeftColor: paleta.borde,
    },
    portadaCampoPrimero: {
        borderLeftWidth: 0,
    },
    portadaCampoIconoFila: {
        marginBottom: 8,
    },
    portadaCampoLabel: {
        fontSize: 8,
        fontFamily: 'Helvetica',
        color: paleta.textoSuave,
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    portadaCampoValor: {
        fontSize: 10,
        fontFamily: 'Helvetica',
        color: paleta.texto,
    },

    // -------- Prescripción: régimen/objetivo + macros --------
    portadaPrescripcionLinea: {
        width: '100%',
        height: 1,
        backgroundColor: paleta.borde,
        marginBottom: 14,
    },
    portadaPrescripcion: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },
    portadaPrescripcionInfo: {
        width: '30%',
        paddingRight: 10,
    },
    portadaIconoBadge: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: paleta.fondoAlterno,
        alignItems: 'center',
        justifyContent: 'center',
    },
    portadaItemIconoTexto: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    portadaItemIconoTextoBloque: {
        marginLeft: 8,
        flex: 1,
    },
    portadaItemLabel: {
        fontSize: 8,
        fontFamily: 'Helvetica',
        color: paleta.textoSuave,
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    portadaItemValor: {
        fontSize: 10,
        fontFamily: 'Helvetica',
        color: paleta.texto,
    },
    portadaMacros: {
        flexDirection: 'row',
        flex: 1,
        justifyContent: 'space-between',
    },
    portadaMacroItem: {
        alignItems: 'center',
        width: '24%',
        borderLeftWidth: 1,
        borderLeftColor: paleta.borde,
        paddingLeft: 8,
    },
    portadaMacroLabel: {
        fontSize: 6,
        fontFamily: 'Helvetica',
        color: paleta.textoSuave,
        letterSpacing: 0.5,
        marginTop: 10,
    },
    portadaMacroValor: {
        fontSize: 19,
        fontFamily: 'Helvetica',
        color: paleta.textoOscuro,
        marginTop: 4,
    },
    portadaMacroUnidad: {
        fontSize: 8,
        color: paleta.textoSuave,
        marginTop: 4,
    },

    // -------- Pie de portada --------
    portadaPie: {
        position: 'absolute',
        bottom: 44,
        left: espaciado.paginaX,
    },
    portadaPieTexto: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: paleta.texto,
        lineHeight: 1.4,
    },
    portadaPieLinea: {
        width: 30,
        height: 2,
        backgroundColor: paleta.primario,
        marginTop: 8,
    },
})
