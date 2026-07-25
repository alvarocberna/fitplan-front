import { Document, Page, Text, View, Svg, Polygon, Circle, Path, Rect, Line, G, Defs, LinearGradient, Stop } from '@react-pdf/renderer'
import { PlanNutricionalDto } from '../dtos/plan-nutricional.dto'
import { styles, paleta } from './plan-nutricional-pdf.styles'
import { obtenerAlimentos, capitalizar } from './plan-nutricional-pdf.constants'

type TiempoDeComida = PlanNutricionalDto['tiempos_de_comida'][number]

// ============================================================
// SUBCOMPONENTES REUTILIZABLES
// Cada uno es intencionalmente chico y "tonto" (solo recibe
// props y pinta), para que puedas retocar el diseño de una
// pieza sin afectar al resto. Los estilos viven todos en
// plan-nutricional-pdf.styles.ts
// ============================================================

// Encabezado repetido en cada página: nombre del paciente + subtítulo de la página actual.
function Encabezado({ plan, subtitulo }: { plan: PlanNutricionalDto; subtitulo: string }) {
    const { nombre, apellido, fecha } = plan.informacion_personal
    return (
        <View style={styles.encabezado} fixed>
            <Text style={styles.encabezadoMarca}>{nombre} {apellido} · {subtitulo}</Text>
            <Text style={styles.encabezadoSubtitulo}>{fecha}</Text>
        </View>
    )
}

// Numeración de página, fija al pie de cada hoja.
function PiePagina() {
    return (
        <Text
            style={styles.piePagina}
            fixed
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
        />
    )
}

// Bloque destacado con los 4 macros. Se usa en la prescripción general y en cada tiempo de comida.
function AporteNutricional({ calorias, proteina, carbohidrato, lipido }: { calorias: number; proteina: number; carbohidrato: number; lipido: number }) {
    return (
        <View style={styles.aporteNutricionalContenedor}>
            <View style={styles.aporteNutricionalSombraDifusa} />
            <View style={styles.aporteNutricionalSombra} />
            <View style={styles.aporteNutricional}>
                <View style={styles.aporteItem}>
                    <Text style={styles.aporteValor}>{calorias}</Text>
                    <Text style={styles.aporteLabel}>Kcal</Text>
                    <View style={styles.aporteLinea} />
                </View>
                <View style={styles.aporteDivisor} />
                <View style={styles.aporteItem}>
                    <Text style={styles.aporteValor}>{proteina}g</Text>
                    <Text style={styles.aporteLabel}>Proteína</Text>
                    <View style={styles.aporteLinea} />
                </View>
                <View style={styles.aporteDivisor} />
                <View style={styles.aporteItem}>
                    <Text style={styles.aporteValor}>{carbohidrato}g</Text>
                    <Text style={styles.aporteLabel}>Carbohidrato</Text>
                    <View style={styles.aporteLinea} />
                </View>
                <View style={styles.aporteDivisor} />
                <View style={styles.aporteItem}>
                    <Text style={styles.aporteValor}>{lipido}g</Text>
                    <Text style={styles.aporteLabel}>Lípido</Text>
                    <View style={styles.aporteLinea} />
                </View>
            </View>
        </View>
    )
}

// ============================================================
// ÍCONOS (portada) — trazos simples dibujados con primitivas Svg,
// para no depender de fuentes de íconos ni assets externos.
// ============================================================
function IconPersona({ size = 16, color = paleta.primario }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={2} fill="none" />
            <Path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
        </Svg>
    )
}

function IconCalendario({ size = 16, color = paleta.primario }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Rect x={3} y={5} width={18} height={16} rx={2} stroke={color} strokeWidth={2} fill="none" />
            <Line x1={3} y1={10} x2={21} y2={10} stroke={color} strokeWidth={2} />
            <Line x1={8} y1={2} x2={8} y2={6} stroke={color} strokeWidth={2} strokeLinecap="round" />
            <Line x1={16} y1={2} x2={16} y2={6} stroke={color} strokeWidth={2} strokeLinecap="round" />
        </Svg>
    )
}

function IconHoja({ size = 16, color = paleta.primario }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M4 20c8 0 14-6 16-16-10 2-16 8-16 16z" stroke={color} strokeWidth={1.5} fill="none" strokeLinejoin="round" />
            <Line x1={6} y1={18} x2={16} y2={8} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
        </Svg>
    )
}

function IconObjetivo({ size = 16, color = paleta.primario }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.5} fill="none" />
            <Circle cx={12} cy={12} r={5} stroke={color} strokeWidth={1.5} fill="none" />
            <Circle cx={12} cy={12} r={1.5} fill={color} />
        </Svg>
    )
}

function IconHexagono({ size = 18, color }: { size?: number; color: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Polygon points="12,2 21,7 21,17 12,22 3,17 3,7" stroke={color} strokeWidth={1.5} fill="none" strokeLinejoin="round" />
        </Svg>
    )
}

function IconTrigo({ size = 18, color }: { size?: number; color: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Polygon points="12,2 21,7 21,17 12,22 3,17 3,7" stroke={color} strokeWidth={1.5} fill="none" strokeLinejoin="round" />
            <Line x1={12} y1={7} x2={12} y2={17} stroke={color} strokeWidth={1.2} />
            <Line x1={9} y1={9} x2={12} y2={12} stroke={color} strokeWidth={1.2} />
            <Line x1={15} y1={9} x2={12} y2={12} stroke={color} strokeWidth={1.2} />
            <Line x1={9} y1={15} x2={12} y2={12} stroke={color} strokeWidth={1.2} />
            <Line x1={15} y1={15} x2={12} y2={12} stroke={color} strokeWidth={1.2} />
        </Svg>
    )
}

function IconGota({ size = 18, color }: { size?: number; color: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M12 2c4 5 7 9 7 13a7 7 0 1 1-14 0c0-4 3-8 7-13z" stroke={color} strokeWidth={1.5} fill="none" strokeLinejoin="round" />
        </Svg>
    )
}

function IconRayo({ size = 18, color }: { size?: number; color: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Polygon points="13,2 4,14 11,14 10,22 20,9 13,9" stroke={color} strokeWidth={1.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        </Svg>
    )
}

// -------- Íconos de hora del día (tabla resumen, columna "Tiempo") --------
function IconSolAmanecer({ size = 20, color = paleta.primario }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M6 18a6 6 0 0 1 12 0" stroke={color} strokeWidth={1.5} fill="none" strokeLinecap="round" />
            <Line x1={12} y1={4} x2={12} y2={7} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
            <Line x1={4.5} y1={9.5} x2={6.5} y2={11.5} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
            <Line x1={19.5} y1={9.5} x2={17.5} y2={11.5} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
            <Line x1={3} y1={18} x2={21} y2={18} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
        </Svg>
    )
}

function IconSolMediodia({ size = 20, color = paleta.primario }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Circle cx={12} cy={12} r={4} stroke={color} strokeWidth={1.5} fill="none" />
            <Line x1={12} y1={2} x2={12} y2={5} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
            <Line x1={12} y1={19} x2={12} y2={22} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
            <Line x1={2} y1={12} x2={5} y2={12} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
            <Line x1={19} y1={12} x2={22} y2={12} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
            <Line x1={4.9} y1={4.9} x2={7} y2={7} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
            <Line x1={17} y1={17} x2={19.1} y2={19.1} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
            <Line x1={4.9} y1={19.1} x2={7} y2={17} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
            <Line x1={17} y1={7} x2={19.1} y2={4.9} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
        </Svg>
    )
}

function IconLuna({ size = 20, color = paleta.primario }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" stroke={color} strokeWidth={1.5} fill="none" strokeLinejoin="round" />
        </Svg>
    )
}

// Elige el ícono de hora (sol amanecer / sol pleno / luna) según la hora del tiempo de comida.
function IconoHora({ hora }: { hora?: string | null }) {
    const horaNum = hora ? parseInt(hora.split(':')[0], 10) : NaN
    if (isNaN(horaNum) || (horaNum >= 12 && horaNum < 19)) return <IconSolMediodia />
    if (horaNum < 12) return <IconSolAmanecer />
    return <IconLuna />
}

// Formas decorativas de fondo de la portada (triángulos + puntos), inspiradas en la identidad de marca.
function DecoracionPortada() {
    const ancho = 595.28
    const alto = 841.89
    // triangulo superior: ocupa el 53% del ancho, pegado al borde derecho
    const anchoTriangulo = ancho * 0.53
    const escalaTriangulo = anchoTriangulo / 1332
    const desplazamientoXTriangulo = ancho - anchoTriangulo
    // veta de esquina superior derecha: ocupa el 30% del ancho, pegada arriba y a la derecha
    const anchoEsquina = ancho * 0.3
    const escalaEsquina = anchoEsquina / 842
    const desplazamientoXEsquina = ancho - anchoEsquina
    // veta lateral derecha: alto = 25% del alto del documento, pegada al borde derecho,
    // a una distancia del borde superior equivalente al 24% del alto del documento
    const altoLateral = alto * 0.25
    const escalaLateral = altoLateral / 888
    const anchoLateral = 760 * escalaLateral
    const desplazamientoXLateral = ancho - anchoLateral
    const desplazamientoYLateral = alto * 0.24
    // veta inferior izquierda: ancho = 48% del ancho del documento, pegada a la esquina inferior izquierda
    const anchoInferior = ancho * 0.48
    const escalaInferior = anchoInferior / 1180
    const altoInferior = 544 * escalaInferior
    const desplazamientoYInferior = alto - altoInferior
    // veta inferior izquierda 2 (detrás de la anterior): ancho = 33% del ancho del documento, pegada a la esquina inferior izquierda
    const anchoInferior2 = ancho * 0.33
    const escalaInferior2 = anchoInferior2 / 816
    const altoInferior2 = 684 * escalaInferior2
    const desplazamientoYInferior2 = alto - altoInferior2
    // arco inferior: ancho = 52% del ancho del documento, pegado al borde inferior,
    // a una distancia del borde izquierdo equivalente al 8% del ancho del documento
    const anchoArco = ancho * 0.52
    const escalaArco = anchoArco / 1288
    const altoArco = 655 * escalaArco
    const desplazamientoXArco = ancho * 0.08
    const desplazamientoYArco = alto - altoArco
    // veta inferior derecha: ancho = 56% del ancho del documento, pegada a la esquina inferior derecha
    const anchoInferiorDerecha = ancho * 0.56
    const escalaInferiorDerecha = anchoInferiorDerecha / 1384
    const altoInferiorDerecha = 636 * escalaInferiorDerecha
    const desplazamientoXInferiorDerecha = ancho - anchoInferiorDerecha
    const desplazamientoYInferiorDerecha = alto - altoInferiorDerecha
    return (
        <Svg style={styles.portadaDecoracion} viewBox={`0 0 ${ancho} ${alto}`} fixed>
            <Defs>
                <LinearGradient id="portadaTrianguloGradiente" x1={960} y1={333} x2={108} y2={47.9999} gradientUnits="userSpaceOnUse">
                    <Stop offset={0} stopColor="#188B54" stopOpacity={0.8} />
                    <Stop offset={1} stopColor="#10B968" stopOpacity={0.3} />
                </LinearGradient>
                <LinearGradient id="portadaEsquinaGradiente" x1={130} y1={500} x2={778} y2={480} gradientUnits="userSpaceOnUse">
                    <Stop offset={0} stopColor="#EFEFEF" stopOpacity={0.6} />
                    <Stop offset={1} stopColor="#D9D9D9" stopOpacity={0.5} />
                </LinearGradient>
                <LinearGradient id="portadaLateralGradiente" x1={668} y1={140} x2={380} y2={868} gradientUnits="userSpaceOnUse">
                    <Stop offset={0} stopColor="#DC2303" stopOpacity={0.5} />
                    <Stop offset={1} stopColor="#FF8E55" stopOpacity={0.2} />
                </LinearGradient>
                <LinearGradient id="portadaInferiorGradiente" x1={344} y1={-60.5745} x2={280} y2={443.426} gradientUnits="userSpaceOnUse">
                    <Stop offset={0} stopColor="#6CDDA7" stopOpacity={0.7} />
                    <Stop offset={0.407637} stopColor="#3CAE77" stopOpacity={0.814059} />
                    <Stop offset={1} stopColor="#188B54" stopOpacity={0.9} />
                </LinearGradient>
                <LinearGradient id="portadaInferior2Gradiente" x1={40} y1={23.9998} x2={608} y2={692} gradientUnits="userSpaceOnUse">
                    <Stop offset={0} stopColor="#DC2303" stopOpacity={0.6} />
                    <Stop offset={0.548665} stopColor="#BE371F" stopOpacity={0.9} />
                    <Stop offset={1} stopColor="#A24939" stopOpacity={0.6} />
                </LinearGradient>
                <LinearGradient id="portadaArcoGradiente" x1={1088} y1={518.563} x2={336} y2={202.563} gradientUnits="userSpaceOnUse">
                    <Stop offset={0} stopColor="#DC2303" stopOpacity={0} />
                    <Stop offset={1} stopColor="#DC2303" stopOpacity={0.2} />
                </LinearGradient>
                <LinearGradient id="portadaInferiorDerechaGradiente" x1={212} y1={556} x2={1384} y2={516} gradientUnits="userSpaceOnUse">
                    <Stop offset={0} stopColor="#EFEFEF" stopOpacity={0.5} />
                    <Stop offset={1} stopColor="#EFEFEF" stopOpacity={0.8} />
                </LinearGradient>
            </Defs>
            {/* triangulo superior (figura personalizada, diseñada en Figma con viewBox 1332x667) */}
            <G transform={`translate(${desplazamientoXTriangulo}, 0) scale(${escalaTriangulo})`}>
                <Path
                    d="M748 610L1332 0H0C0 0 15.5459 25.7946 22.5 36C32.0146 49.9632 54 72 54 72L548 610C548 610 581.102 647.873 610 658C640.221 668.59 662.189 669.696 692 658C718.814 647.48 748 610 748 610Z"
                    fill="url(#portadaTrianguloGradiente)"
                />
            </G>
            {/* veta de esquina superior derecha (figura personalizada, diseñada en Figma con viewBox 842x1228) */}
            <G transform={`translate(${desplazamientoXEsquina}, 0) scale(${escalaEsquina})`}>
                <Path
                    d="M2.42083 180C-3.02604 109.917 2.42083 0 2.42083 0H842.421V1228C842.421 1228 578.995 1169.9 418.421 980C267.244 801.216 92.7561 562.979 50.4208 432C19.6094 336.674 10.1835 279.88 2.42083 180Z"
                    fill="url(#portadaEsquinaGradiente)"
                    fillOpacity={0.5}
                />
            </G>
            {/* veta lateral derecha (figura personalizada, diseñada en Figma con viewBox 760x888) */}
            <G transform={`translate(${desplazamientoXLateral}, ${desplazamientoYLateral}) scale(${escalaLateral})`}>
                <Path
                    d="M652 88C687.55 46.8159 760 0 760 0V676C760 676 556.876 749.599 424 788C260.563 835.233 0 888 0 888C0 888 195.363 804.013 296 716C367.679 653.312 405.126 612.495 456 532C516.285 436.614 564 264 564 264C564 264 601.788 146.171 652 88Z"
                    fill="url(#portadaLateralGradiente)"
                />
            </G>
            {/* arco inferior (figura personalizada, diseñada en Figma con viewBox 1288x655; detrás de las dos vetas inferior izquierda) */}
            <G transform={`translate(${desplazamientoXArco}, ${desplazamientoYArco}) scale(${escalaArco})`}>
                <Path
                    d="M924 162.563L1288 662.563H0L328 162.563C328 162.563 387.219 82.8182 440 50.5634C557.296 -21.1175 669.83 -12.4524 792 50.5634C852.083 81.5545 924 162.563 924 162.563Z"
                    fill="url(#portadaArcoGradiente)"
                    fillOpacity={0.7}
                />
            </G>
            {/* veta inferior izquierda 2 (figura personalizada, diseñada en Figma con viewBox 816x684; detrás de la veta inferior izquierda) */}
            <G transform={`translate(0, ${desplazamientoYInferior2}) scale(${escalaInferior2})`}>
                <Path
                    d="M108 64C156 103.19 816 692 816 692H0V0C0 0 60 24.8102 108 64Z"
                    fill="url(#portadaInferior2Gradiente)"
                    fillOpacity={0.7}
                />
            </G>
            {/* veta inferior izquierda (figura personalizada, diseñada en Figma con viewBox 1180x544) */}
            <G transform={`translate(0, ${desplazamientoYInferior}) scale(${escalaInferior})`}>
                <Path
                    d="M588 107.426L1180 551.426H0V83.4257C0 83.4257 64.1184 49.7314 108 35.4257C240.18 -7.66593 334.746 -15.7774 464 35.4257C516.06 56.049 588 107.426 588 107.426Z"
                    fill="url(#portadaInferiorGradiente)"
                />
            </G>
            {/* veta inferior derecha (figura personalizada, diseñada en Figma con viewBox 1384x636) */}
            <G transform={`translate(${desplazamientoXInferiorDerecha}, ${desplazamientoYInferiorDerecha}) scale(${escalaInferiorDerecha})`}>
                <Path
                    d="M694.346 125.461L0 644H1384V97.4314C1384 97.4314 1308.8 58.0804 1257.33 41.373C1102.3 -8.9529 991.383 -18.4261 839.783 41.373C778.723 65.4586 694.346 125.461 694.346 125.461Z"
                    fill="url(#portadaInferiorDerechaGradiente)"
                />
            </G>
        </Svg>
    )
}

// Decoración de fondo para el resto de páginas (todas menos la portada): una versión
// mínima de DecoracionPortada — un solo detalle sutil en la esquina superior derecha,
// para mantener identidad de marca sin competir con el contenido (tablas, texto).
function DecoracionPagina() {
    const ancho = 595.28
    const alto = 841.89
    const anchoTriangulo = ancho * 0.16
    const escalaTriangulo = anchoTriangulo / 1332
    const desplazamientoXTriangulo = ancho - anchoTriangulo
    return (
        <Svg style={styles.portadaDecoracion} viewBox={`0 0 ${ancho} ${alto}`} fixed>
            <G transform={`translate(${desplazamientoXTriangulo}, 0) scale(${escalaTriangulo})`}>
                <Path
                    d="M748 610L1332 0H0C0 0 15.5459 25.7946 22.5 36C32.0146 49.9632 54 72 54 72L548 610C548 610 581.102 647.873 610 658C640.221 668.59 662.189 669.696 692 658C718.814 647.48 748 610 748 610Z"
                    fill={paleta.primario}
                    fillOpacity={0.07}
                />
            </G>
        </Svg>
    )
}

// Campo de la tarjeta "Información del paciente": ícono arriba, label y valor debajo.
function CampoDatoIcono({ icono, label, valor, primero }: { icono: React.ReactNode; label: string; valor: string | number; primero?: boolean }) {
    return (
        <View style={[styles.portadaCampo, ...(primero ? [styles.portadaCampoPrimero] : [])]}>
            <View style={styles.portadaCampoIconoFila}>{icono}</View>
            <Text style={styles.portadaCampoLabel}>{label}</Text>
            <Text style={styles.portadaCampoValor}>{valor}</Text>
        </View>
    )
}

// Fila "régimen nutricional" / "objetivo principal": ícono en badge + label/valor.
function ItemIconoTexto({ icono, label, valor }: { icono: React.ReactNode; label: string; valor: string }) {
    return (
        <View style={styles.portadaItemIconoTexto}>
            {/* <View style={styles.portadaIconoBadge}>{icono}</View> */}
            <View style={styles.portadaItemIconoTextoBloque}>
                <Text style={styles.portadaItemLabel}>{label}</Text>
                <Text style={styles.portadaItemValor}>{valor}</Text>
            </View>
        </View>
    )
}

// Macro destacado de la portada (proteína, carbohidratos, grasas, energía) con ícono, valor grande y unidad.
function MacroStat({ icono, valor, unidad, label, color }: { icono: React.ReactNode; valor: number; unidad: string; label: string; color: string }) {
    return (
        <View style={styles.portadaMacroItem}>
            {icono}
            <Text style={styles.portadaMacroLabel}>{label}</Text>
            <Text style={styles.portadaMacroValor}>{valor}</Text>
            <Text style={[styles.portadaMacroUnidad, { color }]}>{unidad}</Text>
        </View>
    )
}

// Fila de la tabla-resumen (página 2): un tiempo de comida con sus alimentos y su aporte, en formato compacto.
function FilaResumenTiempo({ tiempo }: { tiempo: TiempoDeComida }) {
    const alimentos = obtenerAlimentos(tiempo)
    return (
        <View style={styles.tablaFila} wrap={false}>
            <View style={styles.tablaColTiempo}>
                <View style={styles.tablaColTiempoFila}>
                    <View style={styles.tablaColTiempoIconoBadge}>
                        <IconoHora hora={tiempo.description.hora} />
                    </View>
                    <View>
                        <Text style={styles.tablaTextoComida}>{capitalizar(tiempo.description.tiempo)}</Text>
                        {tiempo.description.hora && <Text style={[styles.tablaTexto, { color: paleta.textoSuave }]}>{tiempo.description.hora}</Text>}
                    </View>
                </View>
            </View>
            <View style={styles.tablaColAlimentos}>
                {alimentos.map((a, i) => (
                    <View key={i} style={styles.tablaAlimentoFila}>
                        <Text style={styles.tablaTextoBullet}>•</Text>
                        <Text style={styles.tablaTexto}>{a.label}: {a.valor}</Text>
                    </View>
                ))}
            </View>
            <View style={styles.tablaColMacros}>
                <View style={styles.tablaColMacrosSub}>
                    <View style={styles.tablaColMacrosLinea} />
                    <View>
                        <Text style={styles.tablaTextoMacros}>E: {tiempo.aporte.calorias} kcal</Text>
                        <Text style={styles.tablaTextoMacros}>C: {tiempo.aporte.carbohidrato} g</Text>
                    </View>
                </View>
                <View style={styles.tablaColMacrosSub}>
                    <View style={styles.tablaColMacrosLinea} />
                    <View>
                        <Text style={styles.tablaTextoMacros}>P: {tiempo.aporte.proteina} g</Text>
                        <Text style={styles.tablaTextoMacros}>G: {tiempo.aporte.lipido} g</Text>
                    </View>
                </View>
            </View>
        </View>
    )
}

// ============================================================
// DOCUMENTO PRINCIPAL
// ============================================================
export function PlanNutricionalDocument({ plan }: { plan: PlanNutricionalDto }) {
    const { informacion_personal, prescripcion, tiempos_de_comida, suplementos, recomendaciones_deportivas } = plan

    return (
        <Document>

            {/* ============================================================
                PÁGINA 1 — Portada: marca + información del paciente + prescripción
               ============================================================ */}
            <Page size="A4" style={styles.paginaPortada}>
                <DecoracionPortada />
                <View style={styles.portadaBarraIzquierda} />

                <View style={styles.portadaMarca}>
                    <Text style={styles.portadaLogo}>NUVI</Text>
                    <Text style={styles.portadaLogoSubtitulo}>NUTRICIÓN · RENDIMIENTO · BIENESTAR</Text>
                </View>|

                <View style={styles.portadaTituloContenedor}>
                    <Text style={styles.portadaTitulo}>PLAN{'\n'}NUTRICIONAL</Text>
                    <Text style={styles.portadaSubtitulo}>DEPORTIVO</Text>
                    <View style={styles.portadaLinea} />
                    {/* <Text style={styles.portadaTagline}>PLAN PERSONALIZADO{'\n'}BASADO EN CIENCIA Y EVIDENCIA</Text> */}
                </View>

                <View style={styles.portadaTarjetaContenedor}>
                    <View style={styles.aporteNutricionalSombraDifusa} />
                    <View style={styles.aporteNutricionalSombra} />
                    <View style={[styles.portadaTarjeta, { flexDirection: 'column', marginBottom: 0 }]}>
                        <Text style={styles.portadaTituloSeccion}>INFORMACIÓN DEL PACIENTE</Text>
                        <View style={styles.portadaTituloSeccionLinea} />
                        <View style={[styles.portadaTarjeta, { marginBottom: 0 }]}>
                            <CampoDatoIcono primero icono={<IconPersona />} label="NOMBRE" valor={`${informacion_personal.nombre} ${informacion_personal.apellido}`} />
                            <CampoDatoIcono icono={<IconCalendario />} label="EDAD" valor={informacion_personal.edad} />
                            <CampoDatoIcono icono={<IconCalendario />} label="FECHA" valor={informacion_personal.fecha} />
                        </View>
                    </View>
                </View>

                <Text style={styles.portadaTituloSeccion}>PRESCRIPCIÓN</Text>
                <View style={styles.portadaPrescripcionLinea} />
                <View style={styles.portadaPrescripcion}>
                    <View style={styles.portadaPrescripcionInfo}>
                        <ItemIconoTexto icono={<IconHoja size={16} />} label="RÉGIMEN NUTRICIONAL" valor={prescripcion.regimen} />
                        <ItemIconoTexto icono={<IconObjetivo size={16} />} label="OBJETIVO PRINCIPAL" valor={prescripcion.objetivo} />
                    </View>
                    <View style={styles.portadaMacros}>
                        <MacroStat
                            icono={<IconRayo size={22} color={paleta.azulOscuro} />}
                            color={paleta.azulOscuro}
                            valor={prescripcion.calorias}
                            unidad="kcal / día"
                            label="ENERGÍA"
                        />
                        <MacroStat
                            icono={<IconHexagono size={22} color={paleta.primarioOscuro} />}
                            color={paleta.primarioOscuro}
                            valor={prescripcion.proteina}
                            unidad="g / día"
                            label="PROTEÍNA"
                        />
                        <MacroStat
                            icono={<IconTrigo size={22} color={paleta.acentoOscuro} />}
                            color={paleta.acentoOscuro}
                            valor={prescripcion.carbohidrato}
                            unidad="g / día"
                            label="CARBOHIDRATOS"
                        />
                        <MacroStat
                            icono={<IconGota size={22} color={paleta.amarilloOscuro} />}
                            color={paleta.amarilloOscuro}
                            valor={prescripcion.lipido}
                            unidad="g / día"
                            label="GRASAS"
                        />
                    </View>
                </View>

                <View style={styles.portadaPie}>
                    <Text style={styles.portadaPieTexto}>TU MEJOR VERSIÓN{'\n'}ES NUESTRO OBJETIVO.</Text>
                    <View style={styles.portadaPieLinea} />
                </View>
            </Page>

            {/* ============================================================
                PÁGINA 2 — Resumen de todos los tiempos de comida
                (alimentos por tiempo + aporte nutricional, en formato tabla)
               ============================================================ */}
            <Page size="A4" style={styles.page} wrap>
                <DecoracionPagina />
                {/* <Encabezado plan={plan} subtitulo="Resumen de tiempos de comida" /> */}
                <View style={styles.tituloPaginaDobleContenedor}>
                    <Text style={styles.tituloPaginaDobleTexto}>RESUMEN DE</Text>
                    <Text style={styles.tituloPaginaDobleAcento}>TIEMPOS DE COMIDA</Text>
                    <View style={styles.portadaLinea} />
                </View>

                <View style={styles.tablaFilaHeader}>
                    <Text style={[styles.tablaColTiempo, styles.tablaHeaderTexto]}>Tiempo</Text>
                    <Text style={[styles.tablaColAlimentos, styles.tablaHeaderTexto]}>Alimentos</Text>
                    <Text style={[styles.tablaColMacros, styles.tablaHeaderTexto]}>Aporte nutricional</Text>
                </View>
                {tiempos_de_comida.map((tiempo, idx) => (
                    <FilaResumenTiempo key={idx} tiempo={tiempo} />
                ))}

                <PiePagina />
            </Page>

            {/* ============================================================
                UNA PÁGINA POR CADA TIEMPO DE COMIDA
                Orden dentro de cada página: aporte nutricional -> alimentos -> ejemplos -> comentarios
               ============================================================ */}
            {tiempos_de_comida.map((tiempo, idx) => {
                const alimentos = obtenerAlimentos(tiempo)
                return (
                    <Page key={idx} size="A4" style={styles.page} wrap>
                        <DecoracionPagina />
                        {/* <Encabezado plan={plan} subtitulo={capitalizar(tiempo.description.tiempo)} /> */}
                        <Text style={styles.tituloPagina}>
                            <Text style={styles.tituloPaginaTiempoValor}>{capitalizar(tiempo.description.tiempo)}</Text>
                            {tiempo.description.hora ? ` · ${tiempo.description.hora}` : ''}
                        </Text>
                        {/* <View style={styles.portadaLinea} /> */}
            

                        {/* 1. Aporte nutricional */}
                        <AporteNutricional
                            calorias={tiempo.aporte.calorias}
                            proteina={tiempo.aporte.proteina}
                            carbohidrato={tiempo.aporte.carbohidrato}
                            lipido={tiempo.aporte.lipido}
                        />

                        {/* 2. Alimentos que incluye */}
                        <Text style={styles.tituloSeccion}>Alimentos</Text>
                        <View style={styles.seccionLinea} />
                        <View style={styles.tarjeta}>
                            <View style={styles.tablaAlimentosFilaHeader}>
                                <Text style={[styles.tablaAlimentosColGrupo]}>Grupo</Text>
                                <Text style={[styles.tablaAlimentosColPorciones]}>Porciones</Text>
                                <Text style={[styles.tablaAlimentosColEquivalencia]}>Equivalencia</Text>
                            </View>
                            {alimentos.map((a, i) => (
                                <View key={i} style={[styles.tablaAlimentosFila, ...(i === alimentos.length - 1 ? [styles.tablaAlimentosFilaSinBorde] : [])]}>
                                    <Text style={[styles.tablaAlimentosColGrupo, styles.tablaAlimentosCelda, styles.tablaTexto]}>{a.label}</Text>
                                    <Text style={[styles.tablaAlimentosColPorciones, styles.tablaAlimentosCelda, styles.tablaTexto]}>{a.valor}</Text>
                                    <Text style={[styles.tablaAlimentosColEquivalencia, styles.tablaAlimentosCelda, styles.tablaTexto, styles.tablaAlimentosColEquivalenciaBorde]}></Text>
                                </View>
                            ))}
                        </View>

                        {/* 3. Ejemplos */}
                        {tiempo.ejemplos.length > 0 && (
                            <>
                                <Text style={styles.tituloSeccion}>Ejemplos</Text>
                                <View style={styles.seccionLinea} />
                                <View style={styles.tarjeta}>
                                    {tiempo.ejemplos.map((ejemplo, i) => (
                                        <View key={i} style={[styles.listaFila, ...(i < tiempo.ejemplos.length - 1 ? [styles.listaFilaBorde] : [])]}>
                                            <Text style={styles.listaBullet}>{i + 1}.</Text>
                                            <Text style={styles.listaTexto}>{ejemplo}</Text>
                                        </View>
                                    ))}
                                </View>
                            </>
                        )}

                        {/* 4. Comentarios (al final, como pediste) */}
                        {tiempo.comentarios.length > 0 && (
                            <>
                                <Text style={styles.tituloSeccion}>Comentarios</Text>
                                <View style={styles.seccionLinea} />
                                <View style={styles.tarjeta}>
                                    {tiempo.comentarios.map((comentario, i) => (
                                        <View key={i} style={styles.listaFila}>
                                            <Text style={styles.listaBullet}>•</Text>
                                            <Text style={styles.listaTexto}>{comentario}</Text>
                                        </View>
                                    ))}
                                </View>
                            </>
                        )}

                        <PiePagina />
                    </Page>
                )
            })}

            {/* ============================================================
                ÚLTIMA PÁGINA — Suplementos + Recomendaciones deportivas
               ============================================================ */}
            <Page size="A4" style={styles.page} wrap>
                <DecoracionPagina />
                {/* <Encabezado plan={plan} subtitulo="Suplementos y recomendaciones" /> */}
                <View style={styles.tituloPaginaDobleContenedor}>
                    <Text style={[styles.tituloPaginaDobleTexto, { textTransform: 'uppercase' }]}>Suplementos y</Text>
                    <Text style={[styles.tituloPaginaDobleAcento, { textTransform: 'uppercase' }]}>Estrategias deportivas</Text>
                </View>

                <Text style={styles.tituloSeccion}>Suplementos</Text>
                <View style={styles.seccionLinea} />
                {suplementos.map((s, i) => (
                    <View key={i} style={styles.itemDestacado} wrap={false}>
                        <Text style={styles.itemDestacadoTitulo}>{s.supplement}</Text>
                        <Text style={styles.itemDestacadoSubtitulo}>
                            {[s.dosageIndication, s.intakeIndication].filter(Boolean).join(' · ')}
                        </Text>
                        {s.effects.length > 0 && (
                            <>
                                <Text style={styles.itemDestacadoLabel}>Efectos</Text>
                                {s.effects.map((efecto, j) => (
                                    <View key={j} style={styles.listaFila}>
                                        <Text style={styles.listaBullet}>•</Text>
                                        <Text style={styles.listaTexto}>{efecto}</Text>
                                    </View>
                                ))}
                            </>
                        )}
                        {s.considerations.length > 0 && (
                            <>
                                <Text style={styles.itemDestacadoLabel}>Consideraciones</Text>
                                {s.considerations.map((consideracion, j) => (
                                    <View key={j} style={styles.listaFila}>
                                        <Text style={styles.listaBullet}>•</Text>
                                        <Text style={styles.listaTexto}>{consideracion}</Text>
                                    </View>
                                ))}
                            </>
                        )}
                    </View>
                ))}

                <Text style={styles.tituloSeccion}>Recomendaciones deportivas</Text>
                <View style={styles.seccionLinea} />
                {recomendaciones_deportivas.map((r, i) => (
                    <View key={i} style={styles.itemDestacado} wrap={false}>
                        {r.sesion && <Text style={styles.itemDestacadoTitulo}>{r.sesion}</Text>}
                        {r.estrategia && <Text style={styles.itemDestacadoSubtitulo}>{r.estrategia}</Text>}
                        {r.pre_actividad && (
                            <>
                                <Text style={styles.itemDestacadoLabel}>Pre actividad</Text>
                                <Text style={styles.itemDestacadoTexto}>{r.pre_actividad}</Text>
                            </>
                        )}
                        {r.durante_actividad && (
                            <>
                                <Text style={styles.itemDestacadoLabel}>Durante actividad</Text>
                                <Text style={styles.itemDestacadoTexto}>{r.durante_actividad}</Text>
                            </>
                        )}
                        {r.post_actividad && (
                            <>
                                <Text style={styles.itemDestacadoLabel}>Post actividad</Text>
                                <Text style={styles.itemDestacadoTexto}>{r.post_actividad}</Text>
                            </>
                        )}
                    </View>
                ))}

                <PiePagina />
            </Page>
        </Document>
    )
}
