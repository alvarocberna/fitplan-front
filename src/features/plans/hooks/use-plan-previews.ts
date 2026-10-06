'use client'
import { useEffect, useState } from 'react'
import { PlansService } from '../services/plans.service'
import { PlanPreviewDto } from '../dtos/plan-preview.dto'

export type PlanPreviewsState =
    | { status: 'loading'; previews: null }
    | { status: 'ready'; previews: PlanPreviewDto[] }
    //el backend no respondió o no hay ninguna fila activa: el llamador decide el respaldo (p. ej. el catálogo estático)
    | { status: 'error'; previews: null }

//busca las (hasta) 4 fichas de vista previa (una por familia) que muestra el carrusel del home
export function usePlanPreviews(): PlanPreviewsState {
    const [state, setState] = useState<PlanPreviewsState>({ status: 'loading', previews: null })

    useEffect(() => {
        let cancelled = false
        PlansService.getPlanPreviews()
            .then((previews) => {
                if (cancelled) return
                //un arreglo vacío se trata igual que un error: el llamador cae al respaldo estático
                setState(previews.length > 0 ? { status: 'ready', previews } : { status: 'error', previews: null })
            })
            .catch(() => {
                if (!cancelled) setState({ status: 'error', previews: null })
            })
        return () => {
            cancelled = true
        }
    }, [])

    return state
}
