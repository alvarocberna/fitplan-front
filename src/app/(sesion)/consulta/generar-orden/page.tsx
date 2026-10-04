'use client'
//next
import Image from 'next/image'
//features
import { GenerateOrderButton, formatPrice, usePersonalizedProduct } from '@/features'
//shared
import { useConsultation } from '@/shared'

export default function GenerateOrderPage() {
    const { personalInfo } = useConsultation()
    //precio de la consulta: el del producto del backend, que es el monto con que se crea la orden.
    //'—' mientras carga o si no se pudo obtener.
    const { product } = usePersonalizedProduct()
    const price = product ? formatPrice(product.price, product.currency) : '—'

    return (
        <div className="w-full flex flex-col items-center text-center px-6 py-4">
            {/* inner container */}
            <div className="w-[90%] md:w-[80%] mx-auto flex flex-col items-center">
                {/* title */}
                <h1 className="text-2xl md:text-4xl font-bold text-zinc-800 mb-12 self-start">
                    Resumen de tu consulta
                </h1>

                <div className="w-full flex flex-col md:flex-row items-start gap-10">
                    {/* left: item */}
                    <div className="w-full md:w-[65%] flex flex-col gap-6">
                        <div className="w-full flex items-center gap-4 border border-zinc-300 rounded-2xl p-4 text-left">
                            {/* image */}
                            <div className="w-20 md:w-24 flex-shrink-0 border border-zinc-300 rounded-xl overflow-hidden">
                                <Image
                                    src="/images/plan-ejemplo/plan-nuvi-page-001.jpg"
                                    alt="Consulta nutricional personalizada"
                                    width={200}
                                    height={283}
                                    className="w-full h-auto"
                                />
                            </div>
                            {/* info */}
                            <div className="flex-1 flex flex-col">
                                <p className="text-md font-semibold text-zinc-800">
                                    Consulta nutricional personalizada
                                </p>
                                <p className="text-sm text-zinc-500">
                                    Plan generado con IA{personalInfo?.firstName ? ` para ${personalInfo.firstName}` : ''}, a partir de la información que completaste.
                                </p>
                            </div>
                            {/* price */}
                            <p className="w-20 text-right font-semibold text-zinc-800">
                                {price}
                            </p>
                        </div>
                    </div>

                    {/* right: summary + pago */}
                    <div className="w-full md:w-[35%] border border-zinc-300 rounded-2xl p-6 text-left flex flex-col gap-4">
                        <h2 className="text-lg font-bold text-zinc-800">Resumen</h2>

                        <div className="flex flex-col gap-2 text-sm text-zinc-600">
                            <div className="flex items-center justify-between">
                                <span>Subtotal</span>
                                <span>{price}</span>
                            </div>
                        </div>

                        <div className="border-t border-zinc-300 pt-4 flex items-center justify-between">
                            <span className="font-semibold text-zinc-800">Total</span>
                            <span className="text-xl font-bold text-zinc-800">{price}</span>
                        </div>

                        <GenerateOrderButton />
                    </div>
                </div>
            </div>
        </div>
    )
}
