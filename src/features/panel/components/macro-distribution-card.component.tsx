'use client'

//nivo
import { ResponsivePie, type PieCustomLayerProps } from '@nivo/pie'
//features - panel
import { MacrosDto } from '../dtos/my-plan.dto'
import { macroDistribution, type MacroShare } from '../macro-distribution'

interface MacroDistributionCardProps {
    macros: MacrosDto
    title?: string
}

// Card de un plan nutricional con la distribución de sus macronutrientes: arriba el título; abajo, a la
// izquierda una dona (carbohidratos verde, proteínas púrpura, lípidos amarillo) con "Total" y las kcal en
// el centro, y a la derecha la leyenda con el % de las calorías y los gramos de cada uno.
export function MacroDistributionCard({ macros, title = 'Distribución de macronutrientes' }: MacroDistributionCardProps) {
    const shares = macroDistribution(macros)
    const description = shares.map(({ label, percentage, grams }) => `${label} ${percentage} % (${grams} g)`).join(', ')

    return (
        <section
            aria-label={title}
            className="w-full h-full bg-white border border-white rounded-[12px] shadow-lg p-5 flex flex-col gap-4"
        >
            <h2 className="text-base font-semibold text-zinc-900">{title}</h2>

            {shares.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-6">
                    <div
                        className="w-full h-56"
                        role="img"
                        aria-label={`${title}: ${description}. Total ${macros.calories} kcal`}
                        data-testid="macro-distribution-chart"
                    >
                        <MacroDonut shares={shares} calories={macros.calories} />
                    </div>

                    <ul className="flex flex-col gap-3">
                        {shares.map(({ key, label, color, percentage, grams }) => (
                            <li key={key} className="flex items-center justify-between gap-3 text-sm">
                                <span className="flex items-center gap-2 text-zinc-700">
                                    <span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                                    {label}
                                </span>
                                {/* % arriba y gramos debajo */}
                                <span className="flex flex-col items-end leading-tight">
                                    <span className="font-semibold text-zinc-900">{percentage} %</span>
                                    <span className="text-xs text-zinc-500">{grams} g</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <p className="text-zinc-500 text-center py-8">Sin información de macronutrientes</p>
            )}
        </section>
    )
}

type Slice = { id: string; label: string; value: number; color: string; grams: number }

function MacroDonut({ shares, calories }: { shares: MacroShare[]; calories: number }) {
    const data: Slice[] = shares.map(({ key, label, percentage, color, grams }) => ({
        id: key,
        label,
        value: percentage,
        color,
        grams,
    }))

    // "Total" y el aporte calórico en el centro de la dona
    function CenterTotal({ centerX, centerY }: PieCustomLayerProps<Slice>) {
        return (
            <g transform={`translate(${centerX},${centerY})`}>
                <text y={-10} textAnchor="middle" dominantBaseline="central" style={{ fontSize: 12, fill: '#71717a' }}>
                    Total
                </text>
                <text y={10} textAnchor="middle" dominantBaseline="central" style={{ fontSize: 16, fontWeight: 600, fill: '#18181b' }}>
                    {`${calories} kcal`}
                </text>
            </g>
        )
    }

    return (
        <ResponsivePie<Slice>
            data={data}
            margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
            innerRadius={0.65}
            padAngle={1}
            cornerRadius={3}
            colors={({ data: slice }) => slice.color}
            enableArcLabels={false}
            enableArcLinkLabels={false}
            layers={['arcs', CenterTotal]}
            tooltip={({ datum }) => (
                <div className="bg-white border border-zinc-200 rounded-lg shadow px-3 py-2 text-xs text-zinc-700">
                    {datum.label}: {datum.value} % ({datum.data.grams} g)
                </div>
            )}
        />
    )
}
