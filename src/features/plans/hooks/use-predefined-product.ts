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

const IDLE: PredefinedProductState = { status: 'idle', product: null }
const LOADING: PredefinedProductState = { status: 'loading', product: null }

//busca la ficha (precio, miniatura) de la versión de plan con ese código; idle si aún no hay código (selección incompleta)
export function usePredefinedProduct(code: string | null): PredefinedProductState {
    //el resultado se guarda junto a su código: si no corresponde al código actual, la consulta sigue en curso
    const [result, setResult] = useState<{ code: string; state: PredefinedProductState } | null>(null)

    useEffect(() => {
        if (!code) return
        //si cambia el código antes de que responda la consulta anterior, se descarta su resultado
        let cancelled = false
        PlansService.getPredefinedProduct(code)
            .then((product) => {
                if (!cancelled) setResult({ code, state: { status: 'ready', product } })
            })
            .catch(() => {
                if (!cancelled) setResult({ code, state: { status: 'unavailable', product: null } })
            })
        return () => {
            cancelled = true
        }
    }, [code])

    if (!code) return IDLE
    return result?.code === code ? result.state : LOADING
}
