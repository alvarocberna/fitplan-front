'use client'
import { useEffect, useState } from 'react'
import { PlansService } from '../services/plans.service'
import { PredefinedProductDto } from '../dtos/predefined-product.dto'

export type PredefinedProductState =
    | { status: 'idle'; product: null }
    | { status: 'loading'; product: null }
    | { status: 'ready'; product: PredefinedProductDto }
    //la versión no existe, está inactiva (su PDF aún no se sube) o no se pudo consultar
    | { status: 'unavailable'; product: null }

//busca la ficha (precio, miniatura) de la versión de plan con ese código; idle si aún no hay código (selección incompleta)
export function usePredefinedProduct(code: string | null): PredefinedProductState {
    const [state, setState] = useState<PredefinedProductState>({ status: 'idle', product: null })

    useEffect(() => {
        if (!code) {
            setState({ status: 'idle', product: null })
            return
        }
        //si cambia el código antes de que responda la consulta anterior, se descarta su resultado
        let cancelled = false
        setState({ status: 'loading', product: null })
        PlansService.getPredefinedProduct(code)
            .then((product) => {
                if (!cancelled) setState({ status: 'ready', product })
            })
            .catch(() => {
                if (!cancelled) setState({ status: 'unavailable', product: null })
            })
        return () => {
            cancelled = true
        }
    }, [code])

    return state
}
