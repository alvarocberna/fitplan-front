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
    textoSuave: '#6b7280',     // gris medio para textos secundarios / labels
    borde: '#e5e7eb',          // gris claro para líneas divisorias
    fondoAlterno: '#f9fafb',   // fondo gris muy claro (filas alternadas, tarjetas)
    blanco: '#ffffff',
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
    tituloPagina: {
        fontSize: 16,
        fontFamily: 'Helvetica-Bold',
        color: paleta.primario,
        marginBottom: 12,
    },
    tituloSeccion: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        color: paleta.texto,
        marginBottom: 6,
        marginTop: 14,
    },

    // -------- Tarjeta / bloque genérico con borde --------
    tarjeta: {
        borderWidth: 1,
        borderColor: paleta.borde,
        borderRadius: 6,
        padding: 12,
        marginBottom: 16,
    },

    // -------- Grilla de pares label/valor (informacion personal, prescripcion) --------
    filaDatos: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 4,
    },
    columnaDatos: {
        flexDirection: 'column',
        marginBottom: 4,
    },
    campoDato: {
        width: '50%',
        marginBottom: 12,
    },
    campoDatoLabel: {
        fontSize: 11,
        color: paleta.texto,
        fontFamily: 'Helvetica-Bold', // Helvetica estándar no tiene peso "medium"; bold es el más cercano disponible sin registrar una fuente custom
        // textTransform: 'uppercase',
        marginBottom: 4,
    },
    campoDatoValor: {
        fontSize: 11,
        fontFamily: 'Helvetica',
        color: paleta.texto,
    },

    // -------- Bloque de aporte nutricional (macros destacados) --------
    aporteNutricional: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    aporteItem: {
        flex: 1,
        backgroundColor: paleta.primarioSuave,
        paddingVertical: 20,
        marginRight: 2,
        alignItems: 'center',
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
        marginTop: 4,
    },

    // -------- Listas simples (alimentos, ejemplos, comentarios) --------
    listaFila: {
        flexDirection: 'row',
        marginBottom: 4,
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
    tablaAlimentosFila: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: paleta.borde,
        paddingVertical: 6,
    },
    tablaAlimentosFilaHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: paleta.borde,
        color: paleta.texto,
        paddingBottom: 6,
        marginBottom: 6,
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        // textTransform: 'uppercase',
    },
    tablaAlimentosColGrupo: { width: '20%', paddingHorizontal: 4 },
    tablaAlimentosColPorciones: { width: '40%', paddingHorizontal: 4 },
    tablaAlimentosColEquivalencia: { width: '40%', paddingHorizontal: 4 },

    // -------- Tabla resumen (página 2) --------
    tablaFila: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: paleta.borde,
        paddingVertical: 10,
        // marginBottom: 5,
    },
    tablaFilaHeader: {
        flexDirection: 'row',
        backgroundColor: paleta.primario,
        borderRadius: 4,
        paddingVertical: 6,
        marginBottom: 10,
    },
    tablaColTiempo: { width: '20%', paddingLeft: 8 },
    tablaColAlimentos: { width: '50%', paddingHorizontal: 4 },
    tablaColMacros: { width: '30%', paddingHorizontal: 4 },
    tablaHeaderTexto: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: paleta.blanco,
        textTransform: 'uppercase',
    },
    tablaTexto: {
        fontSize: 10,
        lineHeight: 1.4,
    },

    // -------- Suplementos / recomendaciones (última página) --------
    itemDestacado: {
        backgroundColor: paleta.fondoAlterno,
        borderRadius: 6,
        padding: 10,
        marginBottom: 8,
    },
    itemDestacadoTitulo: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: paleta.primario,
        marginBottom: 3,
    },
    itemDestacadoTexto: {
        fontSize: 9,
        lineHeight: 1.4,
        color: paleta.texto,
    },
})
