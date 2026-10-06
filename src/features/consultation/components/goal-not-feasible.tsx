'use client'
//next
import { useRouter } from "next/navigation";
//shared
import { useConsultation } from '@/shared'

interface GoalNotFeasibleProps {
    message: string
}

// Se muestra en la evaluación física cuando el objetivo no es alcanzable sin comprometer el estado
// nutricional (CU-CON-03, ej. bajar de peso con IMC <= 20). Ambas acciones descartan la anamnesis y
// la evaluación física actuales (el perfil se conserva); "Nueva consulta" vuelve al chat.
export function GoalNotFeasible({ message }: GoalNotFeasibleProps) {
    const router = useRouter()
    const { resetAnamnesis, resetMeasurements } = useConsultation()

    const discardConsultation = () => {
        resetAnamnesis()
        resetMeasurements()
    }

    const exit = () => {
        discardConsultation()
        router.push('/inicio')
    }

    const newConsultation = () => {
        discardConsultation()
        router.push('/consulta/anamnesis')
    }

    return (
        <div className="w-full" role="alert">
            <p className="text-zinc-900 text-md mb-8" style={{ textAlign: 'justify' }}>
                {message}
            </p>
            <div className="flex gap-4 w-full mx-auto mb-6">
                <button type="button" onClick={exit} className="secondary-btn h-[40px]">
                    Salir
                </button>
                <button type="button" onClick={newConsultation} className="primary-btn h-[40px]">
                    Nueva consulta
                </button>
            </div>
        </div>
    )
}
