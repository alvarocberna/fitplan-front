'use client'
import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react'
import { EMPTY_PLAN_SELECTION, PlanSelection } from '../data/plan-code'

const STORAGE_KEY = 'plan_selection'

//el carro guarda un solo plan (1 orden = 1 producto = 1 pago): añadir otro reemplaza al anterior
export interface CartItem {
    //slug del plan (p. ej. 'plan-gimnasio-volumen'), para mostrar su título e imagen
    planSlug: string
    //código de la versión elegida (p. ej. 'plan-gimnasio-volumen-50-60-m-joven'), lo que se compra
    code: string
}

interface PersistedState {
    selection: PlanSelection
    cartItem: CartItem | null
}

interface PlanSelectionContextType {
    //peso, talla, sexo y edad que el usuario completó para que el sistema le muestre el plan más adecuado
    selection: PlanSelection
    setSelection: (data: PlanSelection) => void
    setSelectionField: <K extends keyof PlanSelection>(key: K, value: PlanSelection[K]) => void
    cartItem: CartItem | null
    addToCart: (item: CartItem) => void
    clearCart: () => void
    //slug del plan para el que está abierto el modal "Completa tu información", o null si está cerrado
    selectionModalSlug: string | null
    openSelectionModal: (planSlug: string) => void
    closeSelectionModal: () => void
    //indica si ya se terminó de leer el estado persistido en el cliente (útil para no mostrar "carro vacío" antes de tiempo)
    isHydrated: boolean
}

const PlanSelectionContext = createContext<PlanSelectionContextType | null>(null)

const EMPTY_STATE: PersistedState = { selection: EMPTY_PLAN_SELECTION, cartItem: null }

//cargamos información desde el storage
function loadFromStorage(): PersistedState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return EMPTY_STATE
        const parsed = JSON.parse(raw) as Partial<PersistedState>
        return {
            selection: { ...EMPTY_PLAN_SELECTION, ...parsed.selection },
            cartItem: parsed.cartItem ?? null,
        }
    } catch {
        return EMPTY_STATE
    }
}

//guardamos información en el storage
function saveToStorage(data: PersistedState) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {}
}

//crea y posee el estado global de la selección de plan predefinido y del carro. Se monta en el layout
//raíz porque lo comparten rutas públicas distintas (/, /planes-estandar, /planes-estandar/[slug], /carrito).
export function PlanSelectionProvider({ children }: { children: ReactNode }) {
    const [selection, _setSelection] = useState<PlanSelection>(EMPTY_PLAN_SELECTION)
    const [cartItem, _setCartItem] = useState<CartItem | null>(null)
    const [selectionModalSlug, setSelectionModalSlug] = useState<string | null>(null)
    const [isHydrated, setIsHydrated] = useState(false)

    //espejo del estado siempre actualizado, para que un setter lea el valor más reciente aunque se
    //invoque desde un closure viejo y no pise en localStorage el campo que se modificó justo antes
    const stateRef = useRef<PersistedState>({ selection, cartItem })
    stateRef.current = { selection, cartItem }

    //carga el estado persistido recién montado en el cliente, para que el primer render coincida con el del servidor y no genere un hydration mismatch
    useEffect(() => {
        const saved = loadFromStorage()
        _setSelection(saved.selection)
        _setCartItem(saved.cartItem)
        setIsHydrated(true)
    }, [])

    const setSelection = useCallback((data: PlanSelection) => {
        stateRef.current = { ...stateRef.current, selection: data }
        _setSelection(data)
        saveToStorage(stateRef.current)
    }, [])

    const setSelectionField = useCallback(<K extends keyof PlanSelection>(key: K, value: PlanSelection[K]) => {
        setSelection({ ...stateRef.current.selection, [key]: value })
    }, [setSelection])

    const addToCart = useCallback((item: CartItem) => {
        stateRef.current = { ...stateRef.current, cartItem: item }
        _setCartItem(item)
        saveToStorage(stateRef.current)
    }, [])

    const clearCart = useCallback(() => {
        stateRef.current = { ...stateRef.current, cartItem: null }
        _setCartItem(null)
        saveToStorage(stateRef.current)
    }, [])

    const openSelectionModal = useCallback((planSlug: string) => setSelectionModalSlug(planSlug), [])
    const closeSelectionModal = useCallback(() => setSelectionModalSlug(null), [])

    return (
        <PlanSelectionContext.Provider
            value={{
                selection,
                setSelection,
                setSelectionField,
                cartItem,
                addToCart,
                clearCart,
                selectionModalSlug,
                openSelectionModal,
                closeSelectionModal,
                isHydrated,
            }}
        >
            {children}
        </PlanSelectionContext.Provider>
    )
}

//expone el estado y sus funciones
export function usePlanSelection(): PlanSelectionContextType {
    const context = useContext(PlanSelectionContext)
    if (!context) throw new Error('usePlanSelection debe usarse dentro de PlanSelectionProvider')
    return context
}
