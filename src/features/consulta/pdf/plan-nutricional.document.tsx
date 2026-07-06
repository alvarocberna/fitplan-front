import { Document, Page, Text, View } from '@react-pdf/renderer'
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

// Par label/valor usado en "Información del paciente" y "Prescripción".
function CampoDato({ label, valor }: { label: string; valor: string | number }) {
    return (
        <View style={styles.campoDato}>
            <Text style={styles.campoDatoLabel}>{label}</Text>
            <Text style={styles.campoDatoValor}>{valor}</Text>
        </View>
    )
}

// Bloque destacado con los 4 macros. Se usa en la prescripción general y en cada tiempo de comida.
function AporteNutricional({ calorias, proteina, carbohidrato, lipido }: { calorias: number; proteina: number; carbohidrato: number; lipido: number }) {
    return (
        <View style={styles.aporteNutricional}>
            <View style={styles.aporteItem}>
                <Text style={styles.aporteValor}>{calorias}</Text>
                <Text style={styles.aporteLabel}>Kcal</Text>
            </View>
            <View style={styles.aporteItem}>
                <Text style={styles.aporteValor}>{proteina}g</Text>
                <Text style={styles.aporteLabel}>Proteína</Text>
            </View>
            <View style={styles.aporteItem}>
                <Text style={styles.aporteValor}>{carbohidrato}g</Text>
                <Text style={styles.aporteLabel}>Carbohidrato</Text>
            </View>
            <View style={styles.aporteItem}>
                <Text style={styles.aporteValor}>{lipido}g</Text>
                <Text style={styles.aporteLabel}>Lípido</Text>
            </View>
        </View>
    )
}

// Fila de la tabla-resumen (página 2): un tiempo de comida con sus alimentos y su aporte, en formato compacto.
function FilaResumenTiempo({ tiempo }: { tiempo: TiempoDeComida }) {
    const alimentos = obtenerAlimentos(tiempo)
    return (
        <View style={styles.tablaFila} wrap={false}>
            <View style={styles.tablaColTiempo}>
                <Text style={styles.tablaTexto}>{capitalizar(tiempo.description.tiempo)}</Text>
                {tiempo.description.hora && <Text style={[styles.tablaTexto, { color: paleta.textoSuave }]}>{tiempo.description.hora}</Text>}
            </View>
            <View style={styles.tablaColAlimentos}>
                {alimentos.map((a, i) => (
                    <Text key={i} style={styles.tablaTexto}>• {a.label}: {a.valor}</Text>
                ))}
            </View>
            <View style={styles.tablaColMacros}>
                <Text style={styles.tablaTexto}>{tiempo.aporte.calorias} kcal</Text>
                <Text style={styles.tablaTexto}>P: {tiempo.aporte.proteina}g · C: {tiempo.aporte.carbohidrato}g · G: {tiempo.aporte.lipido}g</Text>
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
                PÁGINA 1 — Información personal + Prescripción
               ============================================================ */}
            <Page size="A4" style={styles.page}>
                <Encabezado plan={plan} subtitulo="Plan Nutricional" />

                <Text style={styles.tituloPagina}>Información del paciente</Text>
                <View style={styles.tarjeta}>
                    <View style={styles.filaDatos}>
                        <CampoDato label="Nombre" valor={`${informacion_personal.nombre} ${informacion_personal.apellido}`} />
                        <CampoDato label="Edad" valor={informacion_personal.edad} />
                        <CampoDato label="Fecha" valor={informacion_personal.fecha} />
                    </View>
                </View>

                <Text style={styles.tituloSeccion}>Prescripción</Text>
                <View style={styles.tarjeta}>
                    <View style={styles.filaDatos}>
                        <CampoDato label="Régimen" valor={prescripcion.regimen} />
                        <CampoDato label="Objetivo" valor={prescripcion.objetivo} />
                    </View>
                    <AporteNutricional
                        calorias={prescripcion.calorias}
                        proteina={prescripcion.proteina}
                        carbohidrato={prescripcion.carbohidrato}
                        lipido={prescripcion.lipido}
                    />
                </View>

                <PiePagina />
            </Page>

            {/* ============================================================
                PÁGINA 2 — Resumen de todos los tiempos de comida
                (alimentos por tiempo + aporte nutricional, en formato tabla)
               ============================================================ */}
            <Page size="A4" style={styles.page} wrap>
                <Encabezado plan={plan} subtitulo="Resumen de tiempos de comida" />
                <Text style={styles.tituloPagina}>Resumen de tiempos de comida</Text>

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
                        <Encabezado plan={plan} subtitulo={capitalizar(tiempo.description.tiempo)} />
                        <Text style={styles.tituloPagina}>
                            {capitalizar(tiempo.description.tiempo)}{tiempo.description.hora ? ` · ${tiempo.description.hora}` : ''}
                        </Text>

                        {/* 1. Aporte nutricional */}
                        <AporteNutricional
                            calorias={tiempo.aporte.calorias}
                            proteina={tiempo.aporte.proteina}
                            carbohidrato={tiempo.aporte.carbohidrato}
                            lipido={tiempo.aporte.lipido}
                        />

                        {/* 2. Alimentos que incluye */}
                        <Text style={styles.tituloSeccion}>Alimentos</Text>
                        <View style={styles.tarjeta}>
                            {alimentos.map((a, i) => (
                                <View key={i} style={styles.listaFila}>
                                    <Text style={styles.listaBullet}>•</Text>
                                    <Text style={styles.listaTexto}>
                                        <Text style={styles.listaTextoLabel}>{a.label}: </Text>
                                        {a.valor}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* 3. Ejemplos */}
                        {tiempo.ejemplos.length > 0 && (
                            <>
                                <Text style={styles.tituloSeccion}>Ejemplos</Text>
                                <View style={styles.tarjeta}>
                                    {tiempo.ejemplos.map((ejemplo, i) => (
                                        <View key={i} style={styles.listaFila}>
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
                <Encabezado plan={plan} subtitulo="Suplementos y recomendaciones" />

                <Text style={styles.tituloPagina}>Suplementos</Text>
                {suplementos.map((s, i) => (
                    <View key={i} style={styles.itemDestacado} wrap={false}>
                        <Text style={styles.itemDestacadoTitulo}>{s.suplemento ?? 'Suplemento'}</Text>
                        {s.recomendacion && <Text style={styles.itemDestacadoTexto}>{s.recomendacion}</Text>}
                    </View>
                ))}

                <Text style={styles.tituloSeccion}>Recomendaciones deportivas</Text>
                {recomendaciones_deportivas.map((r, i) => (
                    <View key={i} style={styles.itemDestacado} wrap={false}>
                        {r.sesion && <Text style={styles.itemDestacadoTitulo}>{r.sesion}</Text>}
                        {r.estrategia && <Text style={styles.itemDestacadoTexto}>Estrategia: {r.estrategia}</Text>}
                        {r.pre_actividad && <Text style={styles.itemDestacadoTexto}>Pre actividad: {r.pre_actividad}</Text>}
                        {r.durante_actividad && <Text style={styles.itemDestacadoTexto}>Durante actividad: {r.durante_actividad}</Text>}
                        {r.post_actividad && <Text style={styles.itemDestacadoTexto}>Post actividad: {r.post_actividad}</Text>}
                    </View>
                ))}

                <PiePagina />
            </Page>
        </Document>
    )
}
