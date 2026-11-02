import { Document, Page, Text, View, Svg, Polygon, Circle, Path, Rect, Line, G, Defs, LinearGradient, Stop } from '@react-pdf/renderer'
import { NutritionPlanDto, SupplementPrescription } from '../dtos/nutrition-plan.dto'
import { styles, palette } from './nutrition-plan-pdf.styles'
import { getFoods, capitalize, sumSupplementsIntake } from './nutrition-plan-pdf.constants'

type MealTime = NutritionPlanDto['mealTimes'][number]

// ============================================================
// SUBCOMPONENTES REUTILIZABLES
// Cada uno es intencionalmente chico y "tonto" (solo recibe
// props y pinta), para que puedas retocar el diseño de una
// pieza sin afectar al resto. Los estilos viven todos en
// nutrition-plan-pdf.styles.ts
// ============================================================

// Numeración de página, fija al pie de cada hoja.
function PageFooter() {
    return (
        <Text
            style={styles.pageFooter}
            fixed
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
        />
    )
}

// Bloque destacado con los 4 macros. Se usa en la prescripción general y en cada tiempo de comida.
function NutritionalIntake({ calories, protein, carbohydrate, fat }: { calories: number; protein: number; carbohydrate: number; fat: number }) {
    return (
        <View style={styles.nutritionalIntakeContainer}>
            <View style={styles.nutritionalIntakeDiffuseShadow} />
            <View style={styles.nutritionalIntakeShadow} />
            <View style={styles.nutritionalIntake}>
                <View style={styles.intakeItem}>
                    <Text style={styles.intakeValue}>{calories}</Text>
                    <Text style={styles.intakeLabel}>Kcal</Text>
                    <View style={styles.intakeLine} />
                </View>
                <View style={styles.intakeDivider} />
                <View style={styles.intakeItem}>
                    <Text style={styles.intakeValue}>{protein}g</Text>
                    <Text style={styles.intakeLabel}>Proteína</Text>
                    <View style={styles.intakeLine} />
                </View>
                <View style={styles.intakeDivider} />
                <View style={styles.intakeItem}>
                    <Text style={styles.intakeValue}>{carbohydrate}g</Text>
                    <Text style={styles.intakeLabel}>Carbohidrato</Text>
                    <View style={styles.intakeLine} />
                </View>
                <View style={styles.intakeDivider} />
                <View style={styles.intakeItem}>
                    <Text style={styles.intakeValue}>{fat}g</Text>
                    <Text style={styles.intakeLabel}>Lípido</Text>
                    <View style={styles.intakeLine} />
                </View>
            </View>
        </View>
    )
}

// ============================================================
// ÍCONOS (portada) — trazos simples dibujados con primitivas Svg,
// para no depender de fuentes de íconos ni assets externos.
// ============================================================
function PersonIcon({ size = 16, color = palette.primary }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={2} fill="none" />
            <Path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
        </Svg>
    )
}

function CalendarIcon({ size = 16, color = palette.primary }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Rect x={3} y={5} width={18} height={16} rx={2} stroke={color} strokeWidth={2} fill="none" />
            <Line x1={3} y1={10} x2={21} y2={10} stroke={color} strokeWidth={2} />
            <Line x1={8} y1={2} x2={8} y2={6} stroke={color} strokeWidth={2} strokeLinecap="round" />
            <Line x1={16} y1={2} x2={16} y2={6} stroke={color} strokeWidth={2} strokeLinecap="round" />
        </Svg>
    )
}

function LeafIcon({ size = 16, color = palette.primary }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M4 20c8 0 14-6 16-16-10 2-16 8-16 16z" stroke={color} strokeWidth={1.5} fill="none" strokeLinejoin="round" />
            <Line x1={6} y1={18} x2={16} y2={8} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
        </Svg>
    )
}

function GoalIcon({ size = 16, color = palette.primary }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.5} fill="none" />
            <Circle cx={12} cy={12} r={5} stroke={color} strokeWidth={1.5} fill="none" />
            <Circle cx={12} cy={12} r={1.5} fill={color} />
        </Svg>
    )
}

function HexagonIcon({ size = 18, color }: { size?: number; color: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Polygon points="12,2 21,7 21,17 12,22 3,17 3,7" stroke={color} strokeWidth={1.5} fill="none" strokeLinejoin="round" />
        </Svg>
    )
}

function WheatIcon({ size = 18, color }: { size?: number; color: string }) {
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

function DropIcon({ size = 18, color }: { size?: number; color: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M12 2c4 5 7 9 7 13a7 7 0 1 1-14 0c0-4 3-8 7-13z" stroke={color} strokeWidth={1.5} fill="none" strokeLinejoin="round" />
        </Svg>
    )
}

function BoltIcon({ size = 18, color }: { size?: number; color: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Polygon points="13,2 4,14 11,14 10,22 20,9 13,9" stroke={color} strokeWidth={1.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        </Svg>
    )
}

// -------- Íconos de hora del día (tabla resumen, columna "Tiempo") --------
function SunriseIcon({ size = 20, color = palette.primary }: { size?: number; color?: string }) {
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

function MiddaySunIcon({ size = 20, color = palette.primary }: { size?: number; color?: string }) {
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

function MoonIcon({ size = 20, color = palette.primary }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" stroke={color} strokeWidth={1.5} fill="none" strokeLinejoin="round" />
        </Svg>
    )
}

// Convierte el string de hora a un número de 0 a 23. Soporta tanto formato 24h ("08:00", "20:30")
// como 12h con am/pm ("10am", "1:30pm") — este último es el formato documentado en el DTO
// (nutrition-plan.dto.ts, campo "hour"), que sin esta conversión se interpretaba tal cual
// (ej. "1pm" -> 1), haciendo que casi todas las horas PM cayeran mal.
function hourTo24HourFormat(hour?: string | null): number {
    if (!hour) return NaN
    const match = hour.trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/)
    if (!match) return NaN
    let hourNum = parseInt(match[1], 10)
    const meridian = match[3]
    if (meridian === 'pm' && hourNum !== 12) hourNum += 12
    if (meridian === 'am' && hourNum === 12) hourNum = 0
    return hourNum
}

// Elige el ícono de hora (sol amanecer / sol pleno / luna) según la hora del tiempo de comida.
function TimeIcon({ hour }: { hour?: string | null }) {
    const hourNum = hourTo24HourFormat(hour)
    if (isNaN(hourNum) || (hourNum >= 12 && hourNum < 19)) return <MiddaySunIcon />
    if (hourNum < 12) return <SunriseIcon />
    return <MoonIcon />
}

// Formas decorativas de fondo de la portada (triángulos + puntos), inspiradas en la identidad de marca.
function CoverDecoration() {
    const width = 595.28
    const height = 841.89
    // triangulo superior: ocupa el 53% del ancho, pegado al borde derecho
    const triangleWidth = width * 0.53
    const triangleScale = triangleWidth / 1332
    const triangleOffsetX = width - triangleWidth
    // veta inferior izquierda: ancho = 48% del ancho del documento, pegada a la esquina inferior izquierda
    const bottomWidth = width * 0.48
    const bottomScale = bottomWidth / 1180
    const bottomHeight = 544 * bottomScale
    const bottomOffsetY = height - bottomHeight
    // veta inferior izquierda 2 (detrás de la anterior): ancho = 33% del ancho del documento, pegada a la esquina inferior izquierda
    const bottom2Width = width * 0.33
    const bottom2Scale = bottom2Width / 816
    const bottom2Height = 684 * bottom2Scale
    const bottom2OffsetY = height - bottom2Height
    // arco inferior: ancho = 52% del ancho del documento, pegado al borde inferior,
    // a una distancia del borde izquierdo equivalente al 8% del ancho del documento
    const archWidth = width * 0.52
    const archScale = archWidth / 1288
    const archHeight = 655 * archScale
    const archOffsetX = width * 0.08
    const archOffsetY = height - archHeight
    // veta inferior derecha: ancho = 56% del ancho del documento, pegada a la esquina inferior derecha
    const bottomRightWidth = width * 0.56
    const bottomRightScale = bottomRightWidth / 1384
    const bottomRightHeight = 636 * bottomRightScale
    const bottomRightOffsetX = width - bottomRightWidth
    const bottomRightOffsetY = height - bottomRightHeight
    return (
        <Svg style={styles.coverDecoration} viewBox={`0 0 ${width} ${height}`} fixed>
            <Defs>
                <LinearGradient id="coverTriangleGradient" x1={960} y1={333} x2={108} y2={47.9999} gradientUnits="userSpaceOnUse">
                    <Stop offset={0} stopColor="#01796A" stopOpacity={0.8} />
                    <Stop offset={1} stopColor="#01B49C" stopOpacity={0.3} />
                </LinearGradient>
                <LinearGradient id="coverCornerGradient" x1={130} y1={500} x2={778} y2={480} gradientUnits="userSpaceOnUse">
                    <Stop offset={0} stopColor="#EFEFEF" stopOpacity={0.6} />
                    <Stop offset={1} stopColor="#D9D9D9" stopOpacity={0.5} />
                </LinearGradient>
                <LinearGradient id="coverSideGradient" x1={668} y1={140} x2={380} y2={868} gradientUnits="userSpaceOnUse">
                    <Stop offset={0} stopColor="#9FB0B8" stopOpacity={0.5} />
                    <Stop offset={1} stopColor="#D6DEE2" stopOpacity={0.2} />
                </LinearGradient>
                <LinearGradient id="coverBottomGradient" x1={344} y1={-60.5745} x2={280} y2={443.426} gradientUnits="userSpaceOnUse">
                    <Stop offset={0} stopColor="#6FE3D2" stopOpacity={0.7} />
                    <Stop offset={0.407637} stopColor="#2BC4AE" stopOpacity={0.814059} />
                    <Stop offset={1} stopColor="#01796A" stopOpacity={0.9} />
                </LinearGradient>
                <LinearGradient id="coverBottom2Gradient" x1={40} y1={23.9998} x2={608} y2={692} gradientUnits="userSpaceOnUse">
                    <Stop offset={0} stopColor="#A8B4BA" stopOpacity={0.6} />
                    <Stop offset={0.548665} stopColor="#8A98A2" stopOpacity={0.9} />
                    <Stop offset={1} stopColor="#6B7880" stopOpacity={0.6} />
                </LinearGradient>
                <LinearGradient id="coverArchGradient" x1={1088} y1={518.563} x2={336} y2={202.563} gradientUnits="userSpaceOnUse">
                    <Stop offset={0} stopColor="#9AA8AF" stopOpacity={0} />
                    <Stop offset={1} stopColor="#9AA8AF" stopOpacity={0.2} />
                </LinearGradient>
                <LinearGradient id="coverBottomRightGradient" x1={212} y1={556} x2={1384} y2={516} gradientUnits="userSpaceOnUse">
                    <Stop offset={0} stopColor="#EFEFEF" stopOpacity={0.5} />
                    <Stop offset={1} stopColor="#EFEFEF" stopOpacity={0.8} />
                </LinearGradient>
            </Defs>
            {/* triangulo superior (figura personalizada, diseñada en Figma con viewBox 1332x667) */}
            <G transform={`translate(${triangleOffsetX}, 0) scale(${triangleScale})`}>
                <Path
                    d="M748 610L1332 0H0C0 0 15.5459 25.7946 22.5 36C32.0146 49.9632 54 72 54 72L548 610C548 610 581.102 647.873 610 658C640.221 668.59 662.189 669.696 692 658C718.814 647.48 748 610 748 610Z"
                    fill="url(#coverTriangleGradient)"
                />
            </G>
            {/* veta de esquina superior derecha (figura personalizada, diseñada en Figma con viewBox 842x1228) */}
            {/* <G transform={`translate(${cornerOffsetX}, 0) scale(${cornerScale})`}>
                <Path
                    d="M2.42083 180C-3.02604 109.917 2.42083 0 2.42083 0H842.421V1228C842.421 1228 578.995 1169.9 418.421 980C267.244 801.216 92.7561 562.979 50.4208 432C19.6094 336.674 10.1835 279.88 2.42083 180Z"
                    fill="url(#coverCornerGradient)"
                    fillOpacity={0.5}
                />
            </G> */}
            {/* veta lateral derecha (figura personalizada, diseñada en Figma con viewBox 760x888) */}
            {/* <G transform={`translate(${sideOffsetX}, ${sideOffsetY}) scale(${sideScale})`}>
                <Path
                    d="M652 88C687.55 46.8159 760 0 760 0V676C760 676 556.876 749.599 424 788C260.563 835.233 0 888 0 888C0 888 195.363 804.013 296 716C367.679 653.312 405.126 612.495 456 532C516.285 436.614 564 264 564 264C564 264 601.788 146.171 652 88Z"
                    fill="url(#coverSideGradient)"
                />
            </G> */}
            {/* arco inferior (figura personalizada, diseñada en Figma con viewBox 1288x655; detrás de las dos vetas inferior izquierda) */}
            <G transform={`translate(${archOffsetX}, ${archOffsetY}) scale(${archScale})`}>
                <Path
                    d="M924 162.563L1288 662.563H0L328 162.563C328 162.563 387.219 82.8182 440 50.5634C557.296 -21.1175 669.83 -12.4524 792 50.5634C852.083 81.5545 924 162.563 924 162.563Z"
                    fill="url(#coverArchGradient)"
                    fillOpacity={0.7}
                />
            </G>
            {/* veta inferior izquierda 2 (figura personalizada, diseñada en Figma con viewBox 816x684; detrás de la veta inferior izquierda) */}
            <G transform={`translate(0, ${bottom2OffsetY}) scale(${bottom2Scale})`}>
                <Path
                    d="M108 64C156 103.19 816 692 816 692H0V0C0 0 60 24.8102 108 64Z"
                    fill="url(#coverBottom2Gradient)"
                    fillOpacity={0.7}
                />
            </G>
            {/* veta inferior izquierda (figura personalizada, diseñada en Figma con viewBox 1180x544) */}
            <G transform={`translate(0, ${bottomOffsetY}) scale(${bottomScale})`}>
                <Path
                    d="M588 107.426L1180 551.426H0V83.4257C0 83.4257 64.1184 49.7314 108 35.4257C240.18 -7.66593 334.746 -15.7774 464 35.4257C516.06 56.049 588 107.426 588 107.426Z"
                    fill="url(#coverBottomGradient)"
                />
            </G>
            {/* veta inferior derecha (figura personalizada, diseñada en Figma con viewBox 1384x636) */}
            <G transform={`translate(${bottomRightOffsetX}, ${bottomRightOffsetY}) scale(${bottomRightScale})`}>
                <Path
                    d="M694.346 125.461L0 644H1384V97.4314C1384 97.4314 1308.8 58.0804 1257.33 41.373C1102.3 -8.9529 991.383 -18.4261 839.783 41.373C778.723 65.4586 694.346 125.461 694.346 125.461Z"
                    fill="url(#coverBottomRightGradient)"
                />
            </G>
        </Svg>
    )
}

// Decoración de fondo para el resto de páginas (todas menos la portada): una versión
// mínima de CoverDecoration — un solo detalle sutil en la esquina superior derecha,
// para mantener identidad de marca sin competir con el contenido (tablas, texto).
function PageDecoration() {
    const width = 595.28
    const height = 841.89
    const triangleWidth = width * 0.16
    const triangleScale = triangleWidth / 1332
    const triangleOffsetX = width - triangleWidth
    return (
        <Svg style={styles.coverDecoration} viewBox={`0 0 ${width} ${height}`} fixed>
            <G transform={`translate(${triangleOffsetX}, 0) scale(${triangleScale})`}>
                <Path
                    d="M748 610L1332 0H0C0 0 15.5459 25.7946 22.5 36C32.0146 49.9632 54 72 54 72L548 610C548 610 581.102 647.873 610 658C640.221 668.59 662.189 669.696 692 658C718.814 647.48 748 610 748 610Z"
                    fill={palette.primary}
                    fillOpacity={0.07}
                />
            </G>
        </Svg>
    )
}

// Campo de la tarjeta "Información del paciente": ícono arriba, label y valor debajo.
function IconDataField({ icon, label, value, first }: { icon: React.ReactNode; label: string; value: string | number; first?: boolean }) {
    return (
        <View style={[styles.coverField, ...(first ? [styles.coverFieldFirst] : [])]}>
            <View style={styles.coverFieldIconRow}>{icon}</View>
            <Text style={styles.coverFieldLabel}>{label}</Text>
            <Text style={styles.coverFieldValue}>{value}</Text>
        </View>
    )
}

// Fila "régimen nutricional" / "objetivo principal": ícono en badge + label/valor.
function IconTextItem({ label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <View style={styles.coverIconTextItem}>
            {/* <View style={styles.coverIconBadge}>{icon}</View> */}
            <View style={styles.coverIconTextBlock}>
                <Text style={styles.coverItemLabel}>{label}</Text>
                <Text style={styles.coverItemValue}>{value}</Text>
            </View>
        </View>
    )
}

// Macro destacado de la portada (proteína, carbohidratos, grasas, energía) con ícono, valor grande y unidad.
function MacroStat({ icon, value, unit, label, color }: { icon: React.ReactNode; value: number; unit: string; label: string; color: string }) {
    return (
        <View style={styles.coverMacroItem}>
            {icon}
            <Text style={styles.coverMacroLabel}>{label}</Text>
            <Text style={styles.coverMacroValue}>{value}</Text>
            <Text style={[styles.coverMacroUnit, { color }]}>{unit}</Text>
        </View>
    )
}

// Fila de la tabla-resumen (página 2): un tiempo de comida con sus alimentos y su aporte, en formato compacto.
function MealTimeSummaryRow({ mealTime }: { mealTime: MealTime }) {
    const foods = getFoods(mealTime)
    return (
        <View style={styles.summaryTableRow} wrap={false}>
            <View style={styles.summaryTableTimeCol}>
                <View style={styles.summaryTableTimeColRow}>
                    <View style={styles.summaryTableTimeIconBadge}>
                        <TimeIcon hour={mealTime.description.hour} />
                    </View>
                    <View>
                        <Text style={styles.summaryTableMealText}>{capitalize(mealTime.description.time)}</Text>
                        {mealTime.description.hour && <Text style={[styles.summaryTableText, { color: palette.textSoft }]}>{mealTime.description.hour}</Text>}
                    </View>
                </View>
            </View>
            <View style={styles.summaryTableFoodsCol}>
                {foods.map((food, i) => (
                    <View key={i} style={styles.summaryTableFoodRow}>
                        <Text style={styles.summaryTableTextBullet}>•</Text>
                        <Text style={styles.summaryTableText}>{food.label}: {food.portion}</Text>
                    </View>
                ))}
            </View>
            <View style={styles.summaryTableMacrosCol}>
                <View style={styles.summaryTableMacrosSubCol}>
                    <View style={styles.summaryTableMacrosLine} />
                    <View>
                        <Text style={styles.summaryTableMacrosText}>E: {mealTime.intake.calories} kcal</Text>
                        <Text style={styles.summaryTableMacrosText}>C: {mealTime.intake.carbohydrate} g</Text>
                    </View>
                </View>
                <View style={styles.summaryTableMacrosSubCol}>
                    <View style={styles.summaryTableMacrosLine} />
                    <View>
                        <Text style={styles.summaryTableMacrosText}>P: {mealTime.intake.protein} g</Text>
                        <Text style={styles.summaryTableMacrosText}>G: {mealTime.intake.fat} g</Text>
                    </View>
                </View>
            </View>
        </View>
    )
}

// Fila de la tabla-resumen (página 2): resumen de todos los suplementos, con el mismo
// formato que MealTimeSummaryRow — pero "Tiempo" pasa a ser el título "Suplementos" y
// el aporte nutricional es la suma de los aportes de todos los suplementos.
function SupplementsSummaryRow({ supplements }: { supplements: SupplementPrescription[] }) {
    const intake = sumSupplementsIntake(supplements)
    return (
        <View style={styles.summaryTableRow} wrap={false}>
            <View style={styles.summaryTableTimeCol}>
                <View style={styles.summaryTableTimeColRow}>
                    <View style={styles.summaryTableTimeIconBadge}>
                        <HexagonIcon color={palette.primary} />
                    </View>
                    <Text style={styles.summaryTableMealText}>Suplementos</Text>
                </View>
            </View>
            <View style={styles.summaryTableFoodsCol}>
                {supplements.map((s, i) => (
                    <View key={i} style={styles.summaryTableFoodRow}>
                        <Text style={styles.summaryTableTextBullet}>•</Text>
                        <Text style={styles.summaryTableText}>{s.supplement}: {s.requirement}</Text>
                    </View>
                ))}
            </View>
            <View style={styles.summaryTableMacrosCol}>
                <View style={styles.summaryTableMacrosSubCol}>
                    <View style={styles.summaryTableMacrosLine} />
                    <View>
                        <Text style={styles.summaryTableMacrosText}>E: {intake.calories} kcal</Text>
                        <Text style={styles.summaryTableMacrosText}>C: {intake.carbohydrate} g</Text>
                    </View>
                </View>
                <View style={styles.summaryTableMacrosSubCol}>
                    <View style={styles.summaryTableMacrosLine} />
                    <View>
                        <Text style={styles.summaryTableMacrosText}>P: {intake.protein} g</Text>
                        <Text style={styles.summaryTableMacrosText}>G: {intake.fat} g</Text>
                    </View>
                </View>
            </View>
        </View>
    )
}

// ============================================================
// DOCUMENTO PRINCIPAL
// ============================================================
export function NutritionPlanDocument({ plan }: { plan: NutritionPlanDto }) {
    const { personalInfo, prescription, planIntake, mealTimes, supplements, sportsRecommendations } = plan

    return (
        <Document>

            {/* ============================================================
                PÁGINA 1 — Portada: marca + información del paciente + prescripción
               ============================================================ */}
            <Page size="A4" style={styles.coverPage}>
                <CoverDecoration />
                <View style={styles.coverLeftBar} />

                <View style={styles.coverBrand}>
                    <Text style={styles.coverLogo}>FITPLAN</Text>
                    <Text style={styles.coverLogoSubtitle}>NUTRICIÓN · RENDIMIENTO · BIENESTAR</Text>
                </View>|

                <View style={styles.coverTitleContainer}>
                    <Text style={styles.coverTitle}>PLAN{'\n'}NUTRICIONAL</Text>
                    <Text style={styles.coverSubtitle}>DEPORTIVO</Text>
                    <View style={styles.coverLine} />
                    {/* <Text style={styles.coverTagline}>PLAN PERSONALIZADO{'\n'}BASADO EN CIENCIA Y EVIDENCIA</Text> */}
                </View>

                <View style={styles.coverCardContainer}>
                    <View style={styles.nutritionalIntakeDiffuseShadow} />
                    <View style={styles.nutritionalIntakeShadow} />
                    <View style={[styles.coverCard, { flexDirection: 'column', marginBottom: 0 }]}>
                        <Text style={styles.coverSectionTitle}>INFORMACIÓN DEL PACIENTE</Text>
                        <View style={styles.coverSectionTitleLine} />
                        <View style={[styles.coverCard, { marginBottom: 0 }]}>
                            <IconDataField first icon={<PersonIcon />} label="NOMBRE" value={`${personalInfo.name} ${personalInfo.lastName}`} />
                            <IconDataField icon={<CalendarIcon />} label="EDAD" value={personalInfo.age} />
                            <IconDataField icon={<CalendarIcon />} label="FECHA" value={personalInfo.date} />
                        </View>
                    </View>
                </View>

                <Text style={styles.coverSectionTitle}>PRESCRIPCIÓN</Text>
                <View style={styles.coverPrescriptionLine} />
                <View style={styles.coverPrescription}>
                    <View style={styles.coverPrescriptionInfo}>
                        <IconTextItem icon={<LeafIcon size={16} />} label="RÉGIMEN NUTRICIONAL" value={prescription.regimen} />
                        <IconTextItem icon={<GoalIcon size={16} />} label="OBJETIVO PRINCIPAL" value={prescription.goal} />
                    </View>
                    <View style={styles.coverMacros}>
                        <MacroStat
                            icon={<BoltIcon size={22} color={palette.blueDark} />}
                            color={palette.blueDark}
                            value={Math.round(planIntake.totalIntake.calories)}
                            unit="kcal / día"
                            label="ENERGÍA"
                        />
                        <MacroStat
                            icon={<HexagonIcon size={22} color={palette.primaryDark} />}
                            color={palette.primaryDark}
                            value={Math.round(planIntake.totalIntake.protein)}
                            unit="g / día"
                            label="PROTEÍNA"
                        />
                        <MacroStat
                            icon={<WheatIcon size={22} color={palette.accentDark} />}
                            color={palette.accentDark}
                            value={Math.round(planIntake.totalIntake.carbohydrate)}
                            unit="g / día"
                            label="CARBOHIDRATOS"
                        />
                        <MacroStat
                            icon={<DropIcon size={22} color={palette.yellowDark} />}
                            color={palette.yellowDark}
                            value={Math.round(planIntake.totalIntake.fat)}
                            unit="g / día"
                            label="GRASAS"
                        />
                    </View>
                </View>

                <View style={styles.coverFooter}>
                    <Text style={styles.coverFooterText}>TU MEJOR VERSIÓN{'\n'}ES NUESTRO OBJETIVO.</Text>
                    <View style={styles.coverFooterLine} />
                </View>
            </Page>

            {/* ============================================================
                PÁGINA 2 — Resumen de todos los tiempos de comida
                (alimentos por tiempo + aporte nutricional, en formato tabla)
               ============================================================ */}
            <Page size="A4" style={styles.page} wrap>
                <PageDecoration />
                {/* <Header plan={plan} subtitle="Resumen de tiempos de comida" /> */}
                <View style={styles.pageTitleDoubleContainer}>
                    <Text style={styles.pageTitleDoubleText}>RESUMEN DE</Text>
                    <Text style={styles.pageTitleDoubleAccent}>TIEMPOS DE COMIDA</Text>
                    <View style={styles.coverLine} />
                </View>

                <View style={styles.summaryTableRowHeader}>
                    <Text style={[styles.summaryTableTimeCol, styles.summaryTableHeaderText]}>Tiempo</Text>
                    <Text style={[styles.summaryTableFoodsCol, styles.summaryTableHeaderText]}>Alimentos</Text>
                    <Text style={[styles.summaryTableMacrosCol, styles.summaryTableHeaderText]}>Aporte nutricional</Text>
                </View>
                {mealTimes.map((mealTime, index) => (
                    <MealTimeSummaryRow key={index} mealTime={mealTime} />
                ))}
                {supplements.length > 0 && <SupplementsSummaryRow supplements={supplements} />}

                <PageFooter />
            </Page>

            {/* ============================================================
                UNA PÁGINA POR CADA TIEMPO DE COMIDA
                Orden dentro de cada página: aporte nutricional -> alimentos -> ejemplos -> comentarios
               ============================================================ */}
            {mealTimes.map((mealTime, index) => {
                const foods = getFoods(mealTime)
                return (
                    <Page key={index} size="A4" style={styles.page} wrap>
                        <PageDecoration />
                        {/* <Header plan={plan} subtitle={capitalize(mealTime.description.time)} /> */}
                        <Text style={styles.pageTitle}>
                            <Text style={styles.pageTitleTimeValue}>{capitalize(mealTime.description.time)}</Text>
                            {mealTime.description.hour ? ` · ${mealTime.description.hour}` : ''}
                        </Text>
                        {/* <View style={styles.coverLine} /> */}


                        {/* 1. Aporte nutricional */}
                        <NutritionalIntake
                            calories={mealTime.intake.calories}
                            protein={mealTime.intake.protein}
                            carbohydrate={mealTime.intake.carbohydrate}
                            fat={mealTime.intake.fat}
                        />

                        {/* 2. Alimentos que incluye */}
                        <Text style={styles.sectionTitle}>Alimentos</Text>
                        <View style={styles.sectionLine} />
                        <View style={styles.card}>
                            <View style={styles.foodsTableRowHeader}>
                                <Text style={[styles.foodsTableGroupCol]}>Grupo</Text>
                                <Text style={[styles.foodsTablePortionsCol]}>Porciones</Text>
                                <Text style={[styles.foodsTableEquivalenceCol]}>Equivalencia</Text>
                            </View>
                            {foods.map((food, i) => (
                                <View key={i} style={[styles.foodsTableRow, ...(i === foods.length - 1 ? [styles.foodsTableRowNoBorder] : [])]}>
                                    <Text style={[styles.foodsTableGroupCol, styles.foodsTableCell, styles.summaryTableText]}>{food.label}</Text>
                                    <Text style={[styles.foodsTablePortionsCol, styles.foodsTableCell, styles.summaryTableText]}>{food.portion}</Text>
                                    <Text style={[styles.foodsTableEquivalenceCol, styles.foodsTableCell, styles.summaryTableText, styles.foodsTableEquivalenceColBorder]}>{food.equivalence}</Text>
                                </View>
                            ))}
                        </View>

                        {/* 3. Ejemplos */}
                        {mealTime.examples.length > 0 && (
                            <>
                                <Text style={styles.sectionTitle}>Ejemplos</Text>
                                <View style={styles.sectionLine} />
                                <View style={styles.card}>
                                    {mealTime.examples.map((example, i) => (
                                        <View key={i} style={[styles.listRow, ...(i < mealTime.examples.length - 1 ? [styles.listRowBorder] : [])]}>
                                            <Text style={styles.listBullet}>{i + 1}.</Text>
                                            <Text style={styles.listText}>{example}</Text>
                                        </View>
                                    ))}
                                </View>
                            </>
                        )}

                        {/* 4. Comentarios (al final, como pediste) */}
                        {/* {mealTime.comments.length > 0 && (
                            <>
                                <Text style={styles.sectionTitle}>Comentarios</Text>
                                <View style={styles.sectionLine} />
                                <View style={styles.card}>
                                    {mealTime.comments.map((comment, i) => (
                                        <View key={i} style={styles.listRow}>
                                            <Text style={styles.listBullet}>•</Text>
                                            <Text style={styles.listText}>{comment}</Text>
                                        </View>
                                    ))}
                                </View>
                            </>
                        )} */}

                        <PageFooter />
                    </Page>
                )
            })}

            {/* ============================================================
                ÚLTIMA PÁGINA — Suplementos + Recomendaciones deportivas
               ============================================================ */}
            <Page size="A4" style={styles.page} wrap>
                <PageDecoration />
                {/* <Header plan={plan} subtitle="Suplementos y recomendaciones" /> */}
                <View style={styles.pageTitleDoubleContainer}>
                    <Text style={[styles.pageTitleDoubleText, { textTransform: 'uppercase' }]}>Suplementos y</Text>
                    <Text style={[styles.pageTitleDoubleAccent, { textTransform: 'uppercase' }]}>Estrategias deportivas</Text>
                </View>

                <Text style={styles.sectionTitle}>Suplementos</Text>
                <View style={styles.sectionLine} />
                {supplements.map((s, i) => (
                    <View key={i} style={styles.highlightedItem} wrap={false}>
                        <Text style={styles.highlightedItemTitle}>{s.supplement}</Text>
                        <Text style={styles.highlightedItemSubtitle}>
                            {[s.dosageIndication, s.intakeIndication].filter(Boolean).join(' · ')}
                        </Text>
                        {s.effects.length > 0 && (
                            <>
                                <Text style={styles.highlightedItemLabel}>Efectos</Text>
                                {s.effects.map((effect, j) => (
                                    <View key={j} style={styles.listRow}>
                                        <Text style={styles.listBullet}>•</Text>
                                        <Text style={styles.listText}>{effect}</Text>
                                    </View>
                                ))}
                            </>
                        )}
                        {s.considerations.length > 0 && (
                            <>
                                <Text style={styles.highlightedItemLabel}>Consideraciones</Text>
                                {s.considerations.map((consideration, j) => (
                                    <View key={j} style={styles.listRow}>
                                        <Text style={styles.listBullet}>•</Text>
                                        <Text style={styles.listText}>{consideration}</Text>
                                    </View>
                                ))}
                            </>
                        )}
                    </View>
                ))}

                <Text style={styles.sectionTitle}>Recomendaciones deportivas</Text>
                <View style={styles.sectionLine} />
                {sportsRecommendations.map((recommendation, i) => (
                    <View key={i} style={styles.highlightedItem} wrap={false}>
                        {recommendation.session && <Text style={styles.highlightedItemTitle}>{recommendation.session}</Text>}
                        {recommendation.strategy && <Text style={styles.highlightedItemSubtitle}>{recommendation.strategy}</Text>}
                        {recommendation.preActivity && (
                            <>
                                <Text style={styles.highlightedItemLabel}>Pre actividad</Text>
                                <Text style={styles.highlightedItemText}>{recommendation.preActivity}</Text>
                            </>
                        )}
                        {recommendation.duringActivity && (
                            <>
                                <Text style={styles.highlightedItemLabel}>Durante actividad</Text>
                                <Text style={styles.highlightedItemText}>{recommendation.duringActivity}</Text>
                            </>
                        )}
                        {recommendation.postActivity && (
                            <>
                                <Text style={styles.highlightedItemLabel}>Post actividad</Text>
                                <Text style={styles.highlightedItemText}>{recommendation.postActivity}</Text>
                            </>
                        )}
                    </View>
                ))}

                <PageFooter />
            </Page>
        </Document>
    )
}
