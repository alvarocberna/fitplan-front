'use client'
//next
import { useRouter } from "next/navigation";
//react
import { useState } from "react";
//toast
import { toast } from 'react-toastify'
//features
import { ConsultationService, CompleteConsultationDto } from '@/features';
//shared
import { useConsultation } from '@/shared';


export function GenerateOrderButton(){
    //router
    const router = useRouter();
    //estado de carga mientras se crea la orden
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);
    //llamamos al estado del context necesario para armar la consulta completa
    const { personalInfo, anamnesis, measurements } = useConsultation();

    const onProcessPayment = async () => {
        if (!personalInfo || !anamnesis || !measurements) {
            toast.error('Faltan datos de pasos anteriores');
            return;
        }
        setIsCreatingOrder(true);
        try {
            const completeConsultation: CompleteConsultationDto = {
                personalInfo,
                anamnesis,
                measurements,
            };

            //crea la orden en el backend (paymentStatus=PENDING). La IA todavía NO se ejecuta acá:
            //solo se dispara cuando el pago se confirma (webhook), para no gastar en usuarios que no pagan.
            const { orderId } = await ConsultationService.createOrder(completeConsultation);

            //redirige a la pasarela de pago. Hoy es una pasarela simulada (/pago/[orderId]);
            //cuando se integre un proveedor real, esta es la línea que cambia por la URL de checkout real.
            router.push(`/pago/${orderId}`);
        } catch (error: any) {
            toast.error(error.message || 'Error al iniciar la consulta');
            setIsCreatingOrder(false);
        }
    }

    return (
        <button
            type="button"
            onClick={onProcessPayment}
            disabled={isCreatingOrder}
            className="mt-2 w-full py-2.5 rounded-full text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-primary)' }}
        >
            {isCreatingOrder ? 'Creando orden...' : 'Realizar pago'}
        </button>
    )
}
