//features - measurements
import { BMI_RANGES, BMI_SCALE_MAX, BMI_SCALE_MIN, bmiScalePercent } from '../measurement-detail-data'

interface BmiScaleProps {
    bmi: number
    // BmiClassification del backend; si falta, se deduce del rango.
    classification: string | null
}

// Escala horizontal del IMC por rangos (OMS) con un marcador en el valor de la medición.
export function BmiScale({ bmi, classification }: BmiScaleProps) {
    const range =
        BMI_RANGES.find(({ key }) => key === classification) ??
        BMI_RANGES.find(({ from, to }) => bmi >= from && bmi < to) ??
        (bmi < BMI_SCALE_MIN ? BMI_RANGES[0] : BMI_RANGES[BMI_RANGES.length - 1])
    const position = bmiScalePercent(bmi)
    const span = BMI_SCALE_MAX - BMI_SCALE_MIN

    return (
        <div role="img" aria-label={`IMC ${bmi}, ${range.label.toLowerCase()}`} className="w-full flex flex-col gap-1">
            {/* marcador */}
            <div className="relative h-7">
                <div
                    className="absolute bottom-0 -translate-x-1/2 flex flex-col items-center text-xs font-semibold text-zinc-900"
                    style={{ left: `${position}%` }}
                >
                    <span>{bmi}</span>
                    <span aria-hidden>▼</span>
                </div>
            </div>

            {/* tramos */}
            <div className="flex w-full h-4 rounded-full overflow-hidden">
                {BMI_RANGES.map(({ key, from, to, color }) => (
                    <div
                        key={key}
                        style={{ width: `${((to - from) / span) * 100}%`, backgroundColor: color }}
                        className={key === range.key ? '' : 'opacity-60'}
                    />
                ))}
            </div>

            {/* cortes */}
            <div className="relative h-4 text-[11px] text-zinc-500">
                {BMI_RANGES.slice(1).map(({ key, from }) => (
                    <span key={key} className="absolute -translate-x-1/2" style={{ left: `${bmiScalePercent(from)}%` }}>
                        {from}
                    </span>
                ))}
            </div>

            {/* etiquetas de cada tramo */}
            <div className="flex w-full text-[11px] text-zinc-600">
                {BMI_RANGES.map(({ key, from, to, label, short }) => (
                    <span
                        key={key}
                        style={{ width: `${((to - from) / span) * 100}%` }}
                        className={`text-center truncate ${key === range.key ? 'font-semibold text-zinc-900' : ''}`}
                    >
                        <span className="hidden sm:inline">{label}</span>
                        <span className="sm:hidden">{short}</span>
                    </span>
                ))}
            </div>
        </div>
    )
}
