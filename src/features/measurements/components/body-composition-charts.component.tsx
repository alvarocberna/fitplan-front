'use client'

//nivo
import { ResponsiveBar } from '@nivo/bar'
import { ResponsivePie } from '@nivo/pie'
//features - measurements
import type { BodyCompositionBar, BodyCompositionSlice } from '../measurement-detail-data'

interface BodyCompositionChartsProps {
    bars: BodyCompositionBar[]
    slices: BodyCompositionSlice[]
}

// Composición corporal de una medición: barras con los kg de cada componente y torta con su % del
// peso (más "Resto"). Cada gráfico se omite si no tiene datos.
export function BodyCompositionCharts({ bars, slices }: BodyCompositionChartsProps) {
    // BarDatum exige un Record plano: se arma sin la clave `component`
    const barData = bars.map(({ label, kg, color }) => ({ label, kg, color }))

    return (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
            {barData.length > 0 && (
                <figure className="flex flex-col gap-2">
                    <figcaption className="text-sm font-semibold text-zinc-700 text-center">En kg</figcaption>
                    <div className="w-full h-72" data-testid="body-composition-bar">
                        <ResponsiveBar
                            data={barData}
                            keys={['kg']}
                            indexBy="label"
                            margin={{ top: 16, right: 16, bottom: 48, left: 48 }}
                            padding={0.35}
                            colors={({ data }) => String(data.color)}
                            valueFormat={(value) => `${value} kg`}
                            // tono oscuro de la propia barra: el blanco no se lee sobre el amarillo
                            labelTextColor={{ from: 'color', modifiers: [['darker', 2.6]] }}
                            axisBottom={{ tickRotation: 0 }}
                            axisLeft={{ tickValues: 5 }}
                            enableGridY
                            role="img"
                            ariaLabel="Componentes corporales en kg"
                            tooltip={({ indexValue, value }) => (
                                <div className="bg-white border border-zinc-200 rounded-lg shadow px-3 py-2 text-xs text-zinc-700">
                                    {indexValue}: {value} kg
                                </div>
                            )}
                        />
                    </div>
                </figure>
            )}

            {slices.length > 0 && (
                <figure className="flex flex-col gap-2">
                    <figcaption className="text-sm font-semibold text-zinc-700 text-center">En % del peso</figcaption>
                    <div className="w-full h-72" data-testid="body-composition-pie">
                        <ResponsivePie
                            data={slices}
                            margin={{ top: 24, right: 24, bottom: 24, left: 24 }}
                            innerRadius={0.5}
                            padAngle={1}
                            cornerRadius={3}
                            colors={({ data }) => data.color}
                            valueFormat={(value) => `${value} %`}
                            enableArcLinkLabels={false}
                            arcLabelsSkipAngle={12}
                            arcLabelsTextColor="#18181b"
                            role="img"
                            tooltip={({ datum }) => (
                                <div className="bg-white border border-zinc-200 rounded-lg shadow px-3 py-2 text-xs text-zinc-700">
                                    {datum.label}: {datum.value} %
                                </div>
                            )}
                        />
                    </div>
                    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-zinc-600">
                        {slices.map(({ id, label, value, color }) => (
                            <li key={id} className="flex items-center gap-1.5">
                                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                                {label} ({value} %)
                            </li>
                        ))}
                    </ul>
                </figure>
            )}
        </div>
    )
}
