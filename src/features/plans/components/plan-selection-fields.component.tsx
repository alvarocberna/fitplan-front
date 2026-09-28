'use client'
//react
import { useId } from 'react'
//shared
import {
    usePlanSelection,
    WEIGHT_RANGES,
    SEX_OPTIONS,
    AGE_RANGES,
    type WeightRange,
    type Sex,
    type AgeRange,
} from '@/shared'

const CONTROL_CLASS =
    'block w-full px-3 py-2 text-sm text-zinc-800 bg-white rounded-lg border border-zinc-300 focus:outline-none focus:border-primary'

// Los 4 datos con los que el sistema elige la versión del plan que corresponde al usuario: peso, talla,
// sexo y edad. Leen y escriben directo en el estado global (usePlanSelection), así que lo que se
// completa en el modal de "Seleccionar" es lo mismo que se ve y edita en /planes-estandar/[slug].
export function PlanSelectionFields() {
    const { selection, setSelectionField } = usePlanSelection()
    const id = useId()

    return (
        <div className="flex flex-col gap-4 text-left">
            <div>
                <label htmlFor={`${id}-weight`} className="block mb-1 text-sm font-medium text-zinc-700">
                    Peso
                </label>
                <select
                    id={`${id}-weight`}
                    className={CONTROL_CLASS}
                    value={selection.weightRange}
                    onChange={(event) => setSelectionField('weightRange', event.target.value as WeightRange | '')}
                >
                    <option value="" disabled>
                        Selecciona tu rango de peso
                    </option>
                    {WEIGHT_RANGES.map((range) => (
                        <option key={range.value} value={range.value}>
                            {range.label}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label htmlFor={`${id}-height`} className="block mb-1 text-sm font-medium text-zinc-700">
                    Talla (cm)
                </label>
                <input
                    id={`${id}-height`}
                    type="number"
                    inputMode="decimal"
                    min={1}
                    max={300}
                    step="any"
                    placeholder="Ej: 175"
                    className={CONTROL_CLASS}
                    value={selection.heightCm}
                    onChange={(event) => setSelectionField('heightCm', event.target.value)}
                />
            </div>

            <div>
                <label htmlFor={`${id}-sex`} className="block mb-1 text-sm font-medium text-zinc-700">
                    Sexo
                </label>
                <select
                    id={`${id}-sex`}
                    className={CONTROL_CLASS}
                    value={selection.sex}
                    onChange={(event) => setSelectionField('sex', event.target.value as Sex | '')}
                >
                    <option value="" disabled>
                        Selecciona una opción
                    </option>
                    {SEX_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label htmlFor={`${id}-age`} className="block mb-1 text-sm font-medium text-zinc-700">
                    Edad
                </label>
                <select
                    id={`${id}-age`}
                    className={CONTROL_CLASS}
                    value={selection.ageRange}
                    onChange={(event) => setSelectionField('ageRange', event.target.value as AgeRange | '')}
                >
                    <option value="" disabled>
                        Selecciona tu rango de edad
                    </option>
                    {AGE_RANGES.map((range) => (
                        <option key={range.value} value={range.value}>
                            {range.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    )
}
