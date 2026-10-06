'use client'
import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { CompleteConsultationDto, PersonalInfoDto, AnamnesisDto, MeasurementsDto, NutritionPlanDto } from '@/features';

const STORAGE_KEY = 'consulta_context'

interface ConsultationContextType {
    personalInfo: PersonalInfoDto | null
    anamnesis: AnamnesisDto | null
    measurements: MeasurementsDto | null
    nutritionPlan: NutritionPlanDto | null
    isHydrated: boolean
    setPersonalInfo: (data: PersonalInfoDto) => void
    setAnamnesis: (data: AnamnesisDto) => void
    setMeasurements: (data: MeasurementsDto) => void
    setNutritionPlan: (data: NutritionPlanDto) => void
    getCompleteConsultation: () => CompleteConsultationDto | null
    reset: () => void
    resetPersonalInfo: () => void
    resetAnamnesis: () => void
    resetMeasurements: () => void
    resetNutritionPlan: () => void
}

const ConsultationContext = createContext<ConsultationContextType | null>(null)

//cargamos información desde el storage
function loadFromStorage(): { personalInfo: PersonalInfoDto | null, anamnesis: AnamnesisDto | null, measurements: MeasurementsDto | null, nutritionPlan: NutritionPlanDto | null } {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return { personalInfo: null, anamnesis: null, measurements: null, nutritionPlan: null }
        return JSON.parse(raw)
    } catch {
        return { personalInfo: null, anamnesis: null, measurements: null, nutritionPlan: null }
    }
}

//guardamos información en el storage
function saveToStorage(data: { personalInfo: PersonalInfoDto | null, anamnesis: AnamnesisDto | null, measurements: MeasurementsDto | null, nutritionPlan: NutritionPlanDto | null }) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {}
}

//crea y posee el estado - define funciones que los mutan - expone funciones para acceder al estado
export function ConsultationProvider({ children }: { children: ReactNode }) {
    const [personalInfo, _setPersonalInfo] = useState<PersonalInfoDto | null>(null)
    const [anamnesis, _setAnamnesis] = useState<AnamnesisDto | null>(null)
    const [measurements, _setMeasurements] = useState<MeasurementsDto | null>(null)
    const [nutritionPlan, _setNutritionPlan] = useState<NutritionPlanDto | null>(null)
    //indica si ya se terminó de leer el estado persistido en el cliente (útil para mostrar skeletons mientras tanto)
    const [isHydrated, setIsHydrated] = useState(false)

    // espejo del estado siempre actualizado (se reasigna en cada render, no en un efecto), para que los
    // setters de storage lean el valor más reciente aunque se invoquen desde un closure viejo (ej. un
    // callback capturado en un useEffect con dependencias fijas de otro componente, como el polling de
    // /ordenes/[id]) y así no pisen en localStorage campos que ya fueron hidratados después de ese closure
    const stateRef = useRef({ personalInfo, anamnesis, measurements, nutritionPlan })
    stateRef.current = { personalInfo, anamnesis, measurements, nutritionPlan }

    // actualiza el espejo en el acto (sin esperar al próximo render) y persiste: así dos mutaciones
    // seguidas en el mismo evento (ej. resetAnamnesis() + resetMeasurements()) no se pisan en storage
    const persist = (changes: Partial<typeof stateRef.current>) => {
        stateRef.current = { ...stateRef.current, ...changes }
        saveToStorage(stateRef.current)
    }

    //carga el estado persistido recién montado en el cliente, para que el primer render coincida con el del servidor y no genere un hydration mismatch
    useEffect(() => {
        const saved = loadFromStorage()
        _setPersonalInfo(saved.personalInfo)
        _setAnamnesis(saved.anamnesis)
        _setMeasurements(saved.measurements)
        _setNutritionPlan(saved.nutritionPlan)
        setIsHydrated(true)
    }, [])

    //muta el estado de  informacion personal
    const setPersonalInfo = (data: PersonalInfoDto) => {
        _setPersonalInfo(data)
        persist({ personalInfo: data })
    }

    //muta el estado de anamnesis
    const setAnamnesis = (data: AnamnesisDto) => {
        _setAnamnesis(data)
        persist({ anamnesis: data })
    }

    //muta el estado de evaluacion-fisica
    const setMeasurements = (data: MeasurementsDto) => {
        _setMeasurements(data)
        persist({ measurements: data })
    }

    //muta el estado del plan nutricional
    const setNutritionPlan = (data: NutritionPlanDto) => {
        _setNutritionPlan(data)
        persist({ nutritionPlan: data })
    }

    //accede al estado completo
    const getCompleteConsultation = (): CompleteConsultationDto | null => {
        if (!personalInfo || !anamnesis || !measurements) return null
        return { personalInfo, anamnesis, measurements }
    }

    const reset = () => {
        _setPersonalInfo(null)
        _setAnamnesis(null)
        _setMeasurements(null)
        _setNutritionPlan(null)
        stateRef.current = { personalInfo: null, anamnesis: null, measurements: null, nutritionPlan: null }
        localStorage.removeItem(STORAGE_KEY)
    }

    //limpia solo informacion personal
    const resetPersonalInfo = () => {
        _setPersonalInfo(null)
        persist({ personalInfo: null })
    }

    //limpia solo anamnesis
    const resetAnamnesis = () => {
        _setAnamnesis(null)
        persist({ anamnesis: null })
    }

    //limpia solo evaluacion fisica
    const resetMeasurements = () => {
        _setMeasurements(null)
        persist({ measurements: null })
    }

    //limpia solo plan nutricional
    const resetNutritionPlan = () => {
        _setNutritionPlan(null)
        persist({ nutritionPlan: null })
    }

    return (
        <ConsultationContext.Provider value={{
            personalInfo,
            anamnesis,
            measurements,
            nutritionPlan,
            isHydrated,
            setPersonalInfo,
            setAnamnesis,
            setMeasurements,
            setNutritionPlan,
            getCompleteConsultation,
            reset,
            resetPersonalInfo,
            resetAnamnesis,
            resetMeasurements,
            resetNutritionPlan,
        }}>
            {children}
        </ConsultationContext.Provider>
    )
}

// Hook - Lee el context y
// permite acceder a las tres piezas de estado por separado (info user, anamnesis, measurements)
// sirve para leer/escribir un fragmento puntual a diferencia de getCompleteConsultation()
export function useConsultation() {
    const ctx = useContext(ConsultationContext)
    if (!ctx) throw new Error('useConsultation debe usarse dentro de ConsultationProvider')
    return ctx
}