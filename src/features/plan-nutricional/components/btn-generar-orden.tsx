'use client'
//next
import { useRouter } from "next/navigation";
//react
import { useState } from "react";
//toast
import { toast } from 'react-toastify'
//features
import { ConsultaService, ConsultaCompletaDto } from '@/features';
//shared
import { useConsulta } from '@/shared';


export function BtnGenerarOrden(){
    //router
    const router = useRouter();
    //estado de carga mientras se crea la orden
    const [isCreandoOrden, setIsCreandoOrden] = useState(false);
    //llamamos al estado del context necesario para armar la consulta completa
    const { informacionPersonal, anamnesis, mediciones } = useConsulta();

    const onRealizarPago = async () => {
        if (!informacionPersonal || !anamnesis || !mediciones) {
            toast.error('Faltan datos de pasos anteriores');
            return;
        }
        setIsCreandoOrden(true);
        try {
            const consultaCompleta: ConsultaCompletaDto = {
                informacion_personal: informacionPersonal,
                anamnesis,
                mediciones,
            };

            //crea la orden en el backend (estado_pago='pendiente'). La IA todavía NO se ejecuta acá:
            //solo se dispara cuando el pago se confirma (webhook), para no gastar en usuarios que no pagan.
            const { orden_id } = await ConsultaService.crearOrden(consultaCompleta);

            //redirige a la pasarela de pago. Hoy es una pasarela simulada (/pago/[ordenId]);
            //cuando se integre un proveedor real, esta es la línea que cambia por la URL de checkout real.
            router.push(`/pago/${orden_id}`);
        } catch (error: any) {
            toast.error(error.message || 'Error al iniciar la consulta');
            setIsCreandoOrden(false);
        }
    }

    return (
        <button
            type="button"
            onClick={onRealizarPago}
            disabled={isCreandoOrden}
            className="mt-2 w-full py-2.5 rounded-full text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-primary)' }}
        >
            {isCreandoOrden ? 'Creando orden...' : 'Realizar pago'}
        </button>
    )
}
