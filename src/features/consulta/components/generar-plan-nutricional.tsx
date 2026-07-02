'use client'
//next
import { useRouter } from "next/navigation";
//react
import { useState } from "react";
//toast
import { toast } from 'react-toastify'
//features
import { ConsultaService, ConsultaCompletaDto, useConsulta } from '@/features';

export function GenerarPlanNutricional(){
    //router
    const router = useRouter();
    //estado de carga mientras se genera el plan
    const [isGenerando, setIsGenerando] = useState(false);
    //llamamos al estado del context necesario para armar la consulta completa
    const { informacionPersonal, anamnesis, mediciones, setPlanNutricional } = useConsulta();

    const onGenerarPlan = async () => {
        if (!informacionPersonal || !anamnesis || !mediciones) {
            toast.error('Faltan datos de pasos anteriores');
            return;
        }
        setIsGenerando(true);
        try {
            const consultaCompleta: ConsultaCompletaDto = {
                informacionPersonal,
                anamnesis,
                mediciones,
            };

            //Envía el req y almacena el res en la const planNutricional
            const planNutricional = await ConsultaService.procesarConsulta(consultaCompleta);

            //actualiza la propiedad planNutricional del context con la data del res recibido
            setPlanNutricional(planNutricional);
            toast.success('Consulta procesada con éxito');

            //redirecciona a la ruta plan-nutricional donde se verá toda la info del plan nutricional
            router.push('/consulta/plan-nutricional');
        } catch (error: any) {
            toast.error(error.message || 'Error al procesar la consulta');
            setIsGenerando(false);
        }
    }

    if (isGenerando) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
                <span className="text-gray-600 font-medium">Generando plan...</span>
            </div>
        )
    }

    return (
        <div className='w-1/2 h-[40px] mx-auto mt-5 mb-10'>
            <button
                type="button"
                onClick={onGenerarPlan}
                className='primary-btn'
            >
                Generar plan nutricional
            </button>
        </div>
    )
}
