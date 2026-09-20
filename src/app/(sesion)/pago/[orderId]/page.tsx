'use client'
//next
import { useParams, useRouter } from 'next/navigation'
//react
import { useState } from 'react'
//toast
import { toast } from 'react-toastify'
//features
import { ConsultationService } from '@/features'

// Pasarela de pago SIMULADA: no procesa ningún pago real, solo da la sensación de un checkout
// mientras no exista una integración con un proveedor real (Mercado Pago, Flow, Stripe, etc.).
// Al integrar uno real, esta página se reemplaza por la redirección al checkout de ese proveedor,
// y el botón "Pagar" de acá deja de existir (la confirmación llegaría por su webhook real).
export default function SimulatedPaymentPage() {
    const { orderId } = useParams<{ orderId: string }>()
    const router = useRouter()
    const [isPaying, setIsPaying] = useState(false)

    const onPay = async () => {
        setIsPaying(true)
        try {
            //dispara la misma lógica que ejecutaría el webhook real de la pasarela
            await ConsultationService.simulatePayment(orderId)
            router.push(`/ordenes/${orderId}`)
        } catch (error: any) {
            toast.error(error.message || 'Error al procesar el pago')
            setIsPaying(false)
        }
    }

    return (
        <div className="w-full flex justify-center px-6 py-4">
            <div className="w-full max-w-md border border-zinc-300 rounded-2xl p-8 flex flex-col gap-6 text-left">
                <div>
                    <h1 className="text-xl font-bold text-zinc-800">Pasarela de pago</h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        Checkout simulado — acá se integrará un proveedor de pago real.
                    </p>
                </div>

                {/* campos decorativos: no son funcionales, solo dan la sensación de un checkout real */}
                <div className="flex flex-col gap-3">
                    <div>
                        <label className="text-xs text-zinc-500">Número de tarjeta</label>
                        <input
                            disabled
                            placeholder="4242 4242 4242 4242"
                            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-400 mt-1"
                        />
                    </div>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="text-xs text-zinc-500">Vencimiento</label>
                            <input
                                disabled
                                placeholder="12/29"
                                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-400 mt-1"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-zinc-500">CVV</label>
                            <input
                                disabled
                                placeholder="123"
                                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-400 mt-1"
                            />
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onPay}
                    disabled={isPaying}
                    className="w-full py-2.5 rounded-full text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                >
                    {isPaying ? 'Procesando pago...' : 'Pagar'}
                </button>
            </div>
        </div>
    )
}
