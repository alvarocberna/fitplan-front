'use client'
import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { ConsultaCompletaDto, InformacionPersonalDto, AnamnesisDto, MedicionesDto, PlanNutricionalDto } from '@/features';

const STORAGE_KEY = 'consulta_context'

interface ConsultaContextType {
    informacionPersonal: InformacionPersonalDto | null
    anamnesis: AnamnesisDto | null
    mediciones: MedicionesDto | null
    planNutricional: PlanNutricionalDto | null
    isHydrated: boolean
    setInformacionPersonal: (data: InformacionPersonalDto) => void
    setAnamnesis: (data: AnamnesisDto) => void
    setMediciones: (data: MedicionesDto) => void
    setPlanNutricional: (data: PlanNutricionalDto) => void
    getConsultaCompleta: () => ConsultaCompletaDto | null
    reset: () => void
    resetInformacionPersonal: () => void
    resetAnamnesis: () => void
    resetMediciones: () => void
    resetPlanNutricional: () => void
}

const ConsultaContext = createContext<ConsultaContextType | null>(null)

//cargamos información desde el storage
function loadFromStorage(): { informacionPersonal: InformacionPersonalDto | null, anamnesis: AnamnesisDto | null, mediciones: MedicionesDto | null, planNutricional: PlanNutricionalDto | null } {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return { informacionPersonal: null, anamnesis: null, mediciones: null, planNutricional: null }
        return JSON.parse(raw)
    } catch {
        return { informacionPersonal: null, anamnesis: null, mediciones: null, planNutricional: null }
    }
}

//guardamos información en el storage
function saveToStorage(data: { informacionPersonal: InformacionPersonalDto | null, anamnesis: AnamnesisDto | null, mediciones: MedicionesDto | null, planNutricional: PlanNutricionalDto | null }) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {}
}

//crea y posee el estado - define funciones que los mutan - expone funciones para acceder al estado
export function ConsultaProvider({ children }: { children: ReactNode }) {
    const [informacionPersonal, _setInformacionPersonal] = useState<InformacionPersonalDto | null>(null)
    const [anamnesis, _setAnamnesis] = useState<AnamnesisDto | null>(null)
    const [mediciones, _setMediciones] = useState<MedicionesDto | null>(null)
    const [planNutricional, _setPlanNutricional] = useState<PlanNutricionalDto | null>(null)
    //indica si ya se terminó de leer el estado persistido en el cliente (útil para mostrar skeletons mientras tanto)
    const [isHydrated, setIsHydrated] = useState(false)

    // espejo del estado siempre actualizado (se reasigna en cada render, no en un efecto), para que los
    // setters de storage lean el valor más reciente aunque se invoquen desde un closure viejo (ej. un
    // callback capturado en un useEffect con dependencias fijas de otro componente, como el polling de
    // /ordenes/[id]) y así no pisen en localStorage campos que ya fueron hidratados después de ese closure
    const stateRef = useRef({ informacionPersonal, anamnesis, mediciones, planNutricional })
    stateRef.current = { informacionPersonal, anamnesis, mediciones, planNutricional }

    //carga el estado persistido recién montado en el cliente, para que el primer render coincida con el del servidor y no genere un hydration mismatch
    useEffect(() => {
        const saved = loadFromStorage()
        _setInformacionPersonal(saved.informacionPersonal)
        _setAnamnesis(saved.anamnesis)
        _setMediciones(saved.mediciones)
        _setPlanNutricional(saved.planNutricional)
        setIsHydrated(true)
    }, [])

    //muta el estado de  informacion personal
    const setInformacionPersonal = (data: InformacionPersonalDto) => {
        _setInformacionPersonal(data)
        saveToStorage({ ...stateRef.current, informacionPersonal: data })
    }

    //muta el estado de anamnesis
    const setAnamnesis = (data: AnamnesisDto) => {
        _setAnamnesis(data)
        saveToStorage({ ...stateRef.current, anamnesis: data })
    }

    //muta el estado de evaluacion-fisica
    const setMediciones = (data: MedicionesDto) => {
        _setMediciones(data)
        saveToStorage({ ...stateRef.current, mediciones: data })
    }

    //muta el estado del plan nutricional
    const setPlanNutricional = (data: PlanNutricionalDto) => {
        _setPlanNutricional(data)
        saveToStorage({ ...stateRef.current, planNutricional: data })
    }

    //accede al estado completo
    const getConsultaCompleta = (): ConsultaCompletaDto | null => {
        if (!informacionPersonal || !anamnesis || !mediciones) return null
        return { informacion_personal: informacionPersonal, anamnesis, mediciones }
    }

    const reset = () => {
        _setInformacionPersonal(null)
        _setAnamnesis(null)
        _setMediciones(null)
        _setPlanNutricional(null)
        localStorage.removeItem(STORAGE_KEY)
    }

    //limpia solo informacion personal
    const resetInformacionPersonal = () => {
        _setInformacionPersonal(null)
        saveToStorage({ ...stateRef.current, informacionPersonal: null })
    }

    //limpia solo anamnesis
    const resetAnamnesis = () => {
        _setAnamnesis(null)
        saveToStorage({ ...stateRef.current, anamnesis: null })
    }

    //limpia solo evaluacion fisica
    const resetMediciones = () => {
        _setMediciones(null)
        saveToStorage({ ...stateRef.current, mediciones: null })
    }

    //limpia solo plan nutricional
    const resetPlanNutricional = () => {
        _setPlanNutricional(null)
        saveToStorage({ ...stateRef.current, planNutricional: null })
    }

    return (
        <ConsultaContext.Provider value={{
            informacionPersonal,
            anamnesis,
            mediciones,
            planNutricional,
            isHydrated,
            setInformacionPersonal,
            setAnamnesis,
            setMediciones,
            setPlanNutricional,
            getConsultaCompleta,
            reset,
            resetInformacionPersonal,
            resetAnamnesis,
            resetMediciones,
            resetPlanNutricional,
        }}>
            {children}
        </ConsultaContext.Provider>
    )
}

// Hook - Lee el context y
// permite acceder a las tres piezas de estado por separado (info user, anamnesis, mediciones)
// sirve para leer/escribir un fragmento puntual a diferencia de getConsultaCompleta()
export function useConsulta() {
    const ctx = useContext(ConsultaContext)
    if (!ctx) throw new Error('useConsulta debe usarse dentro de ConsultaProvider')
    return ctx
}
