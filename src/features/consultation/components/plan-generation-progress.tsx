'use client'
//react
import { useEffect, useState } from 'react'

// Avance SIMULADO de la generación del plan: no refleja el proceso real del backend, solo da
// sensación de progreso durante los 2-3 minutos que suele tardar. Nunca llega al tope: si la barra
// se completara y el plan todavía no estuviera listo, la espera se sentiría como un fallo.
export const MAX_GENERATION_PROGRESS = 90
// constante de tiempo de la curva: ~57% al minuto, ~78% a los 2 min, ~86% a los 3 min
const PROGRESS_TIME_CONSTANT_MS = 60_000
const TICK_MS = 1000

// Curva asintótica: rápida al inicio y cada vez más lenta, acercándose a MAX_GENERATION_PROGRESS
// sin alcanzarlo (así la barra siempre se mueve un poco, aunque la generación se alargue).
export function generationProgress(elapsedMs: number): number {
    const elapsed = Math.max(0, elapsedMs)
    return MAX_GENERATION_PROGRESS * (1 - Math.exp(-elapsed / PROGRESS_TIME_CONSTANT_MS))
}

// Etapas decorativas según el avance (tampoco reflejan el proceso real).
const STAGES: { until: number; label: string }[] = [
    { until: 25, label: 'Analizando tu información…' },
    { until: 50, label: 'Calculando tus requerimientos…' },
    { until: 75, label: 'Armando tus comidas…' },
    { until: Infinity, label: 'Preparando tu documento…' },
]

const storageKey = (orderId: string) => `plan_generation_started_${orderId}`

// Momento en que empezó a mostrarse el avance de una orden. Se guarda en sessionStorage para que al
// recargar la página la barra continúe donde iba en vez de volver a 0. Sin storage disponible
// (modo privado, bloqueado) simplemente parte de ahora.
export function getGenerationStart(orderId: string): number {
    const now = Date.now()
    try {
        const stored = Number(sessionStorage.getItem(storageKey(orderId)))
        if (Number.isFinite(stored) && stored > 0 && stored <= now) return stored
        sessionStorage.setItem(storageKey(orderId), String(now))
    } catch {
        // sin sessionStorage: el avance no sobrevive a una recarga
    }
    return now
}

export function clearGenerationStart(orderId: string): void {
    try {
        sessionStorage.removeItem(storageKey(orderId))
    } catch {
        // nada que limpiar
    }
}

interface Props {
    // momento (ms) desde el que se cuenta el avance, ver getGenerationStart
    startedAt: number
}

export const PlanGenerationProgress = ({ startedAt }: Props) => {
    const [progress, setProgress] = useState(() => generationProgress(Date.now() - startedAt))

    useEffect(() => {
        const update = () => setProgress(generationProgress(Date.now() - startedAt))
        update()
        const intervalId = setInterval(update, TICK_MS)
        return () => clearInterval(intervalId)
    }, [startedAt])

    // redondeo hacia abajo: el número mostrado nunca alcanza el tope
    const percent = Math.min(Math.floor(progress), MAX_GENERATION_PROGRESS - 1)
    const stage = STAGES.find((s) => percent < s.until) ?? STAGES[STAGES.length - 1]

    return (
        <div className="flex flex-col items-center gap-4 w-full max-w-md">
            <span className="text-gray-600 font-medium text-center">
                Estamos generando tu plan nutricional
            </span>

            <div className="w-full flex items-center gap-3">
                <div
                    role="progressbar"
                    aria-label="Avance de la generación del plan"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percent}
                    className="relative flex-1 h-2.5 rounded-full bg-gray-200 overflow-hidden"
                >
                    <div
                        className="relative h-full rounded-full bg-primary overflow-hidden transition-[width] duration-1000 ease-linear motion-reduce:transition-none"
                        style={{ width: `${progress}%` }}
                    >
                        {/* brillo que recorre la barra: se ve viva entre un avance y el siguiente */}
                        <span
                            aria-hidden="true"
                            className="absolute inset-y-0 left-0 w-1/2 bg-linear-to-r from-transparent via-white/50 to-transparent animate-[progressShimmer_1.8s_ease-in-out_infinite] motion-reduce:hidden"
                        />
                    </div>
                </div>
                <span className="w-10 text-right text-sm font-medium text-gray-600 tabular-nums">
                    {percent}%
                </span>
            </div>

            <span className="text-sm text-gray-600" aria-live="polite">
                {stage.label}
            </span>

            <p className="text-sm text-gray-500 text-center">
                Este proceso suele tardar entre 2 y 3 minutos. Puedes dejar esta página abierta: tu plan
                aparecerá aquí apenas esté listo.
            </p>
        </div>
    )
}
