'use client'
import { useEffect, useState } from 'react'
import { PlansService } from '../services/plans.service'
import { PersonalizedProductDto } from '../dtos/personalized-product.dto'

export type PersonalizedProductState =
    | { status: 'loading'; product: null }
    | { status: 'ready'; product: PersonalizedProductDto }
    //el backend no tiene el producto cargado o no se pudo consultar
    | { status: 'unavailable'; product: null }

//busca la ficha (precio) del plan personalizado, que es lo que se cobra por la consulta
export function usePersonalizedProduct(): PersonalizedProductState {
    const [state, setState] = useState<PersonalizedProductState>({ status: 'loading', product: null })

    useEffect(() => {
        let cancelled = false
        PlansService.getPersonalizedProduct()
            .then((product) => {
                if (!cancelled) setState({ status: 'ready', product })
            })
            .catch(() => {
                if (!cancelled) setState({ status: 'unavailable', product: null })
            })
        return () => {
            cancelled = true
        }
    }, [])

    return state
}
