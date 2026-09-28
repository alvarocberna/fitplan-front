'use client'
//react
import { useState } from 'react'
//next
import Link from 'next/link'
import { useRouter } from 'next/navigation'
//toast
import { toast } from 'react-toastify'
//shared
import { PLANS, usePlanSelection } from '@/shared'
//features - plans
import { PlansService, SessionRequiredError } from '../services/plans.service'
import { usePredefinedProduct } from '../hooks/use-predefined-product'
import { formatPrice } from '../format-price'
import { PlanPreviewImage } from './plan-preview-image.component'
import { LoginModal } from './login-modal.component'

interface CartViewProps {
    //si hay una sesión válida; lo resuelve el Server Component de /carrito (la cookie es httpOnly)
    isAuthenticated: boolean
}

// Carro de compras: un solo plan predefinido (la versión que el sistema eligió según peso, sexo y edad
// del usuario). "Pagar" crea la orden y lleva a la pasarela; sin sesión abre antes el modal de registro,
// que al terminar devuelve al usuario a este mismo carro (el carro sobrevive en localStorage).
export function CartView({ isAuthenticated }: CartViewProps) {
    const router = useRouter()
    const { cartItem, clearCart, isHydrated } = usePlanSelection()
    const { status, product } = usePredefinedProduct(cartItem?.code ?? null)
    const [showLogin, setShowLogin] = useState(false)
    const [isPaying, setIsPaying] = useState(false)

    const plan = cartItem ? PLANS.find((p) => p.slug === cartItem.planSlug) : undefined
    const canPay = status === 'ready' && !isPaying

    const onPay = async () => {
        if (!cartItem || status !== 'ready') return
        if (!isAuthenticated) {
            setShowLogin(true)
            return
        }
        setIsPaying(true)
        try {
            const { orderId } = await PlansService.createPredefinedOrder(cartItem.code)
            //?tipo=predefinido: tras pagar, la pasarela lleva al panel (no a /ordenes, que es del plan personalizado)
            router.push(`/pago/${orderId}?tipo=predefinido`)
        } catch (error) {
            //la sesión pudo expirar desde que cargó la página: se pide iniciarla de nuevo en vez de fallar sin más
            if (error instanceof SessionRequiredError) {
                setShowLogin(true)
            } else {
                toast.error(error instanceof Error ? error.message : 'No se pudo iniciar el pago')
            }
            setIsPaying(false)
        }
    }

    return (
        <div className="w-full min-h-screen flex flex-col items-center text-center px-6 pt-40 pb-20">
            {/* inner container */}
            <div className="w-[90%] md:w-[80%] mx-auto flex flex-col items-center">
                {/* title */}
                <h1 className="text-2xl md:text-4xl font-bold text-zinc-800 mb-12 self-start">Carro de compras</h1>

                <div className="w-full flex flex-col md:flex-row items-start gap-10">
                    {/* left: item */}
                    <div className="w-full md:w-[65%] flex flex-col gap-6">
                        {isHydrated && cartItem && plan && (
                            <div className="w-full flex items-center gap-4 border border-zinc-300 rounded-2xl p-4 text-left">
                                {/* image */}
                                <div className="w-20 md:w-24 flex-shrink-0 border border-zinc-300 rounded-xl overflow-hidden">
                                    <PlanPreviewImage
                                        thumbnailUrl={product?.thumbnailUrl ?? null}
                                        fallbackSrc={plan.imgUrl}
                                        alt={plan.title}
                                    />
                                </div>
                                {/* info */}
                                <div className="flex-1 flex flex-col">
                                    <p className="text-md font-semibold text-zinc-800">{product?.name ?? plan.title}</p>
                                    <p className="text-sm text-zinc-500">{plan.description[0]}</p>
                                    {status === 'unavailable' && (
                                        <p role="alert" className="mt-1 text-sm text-red-500">
                                            Esta versión del plan ya no está disponible. Elige otra desde los planes.
                                        </p>
                                    )}
                                </div>
                                {/* price */}
                                <p className="w-24 text-right font-semibold text-zinc-800">
                                    {product ? formatPrice(product.price, product.currency) : ''}
                                </p>
                                {/* remove */}
                                <button
                                    type="button"
                                    onClick={clearCart}
                                    aria-label="Quitar del carro"
                                    className="text-zinc-400 hover:text-zinc-700 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        )}

                        {isHydrated && !cartItem && <p className="text-zinc-500 text-left">Tu carro está vacío.</p>}
                    </div>

                    {/* right: summary */}
                    <div className="w-full md:w-[35%] border border-zinc-300 rounded-2xl p-6 text-left flex flex-col gap-4">
                        <h2 className="text-lg font-bold text-zinc-800">Resumen</h2>

                        <div className="flex flex-col gap-2 text-sm text-zinc-600">
                            <div className="flex items-center justify-between">
                                <span>Subtotal</span>
                                <span>{product ? formatPrice(product.price, product.currency) : '—'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Descuentos</span>
                                <span>{product ? formatPrice(0, product.currency) : '—'}</span>
                            </div>
                        </div>

                        <div className="border-t border-zinc-300 pt-4 flex items-center justify-between">
                            <span className="font-semibold text-zinc-800">Total</span>
                            <span className="text-xl font-bold text-zinc-800">
                                {product ? formatPrice(product.price, product.currency) : '—'}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={onPay}
                            disabled={!canPay}
                            className="mt-2 w-full py-2.5 rounded-full text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: 'var(--color-primary)' }}
                        >
                            {isPaying ? 'Redirigiendo...' : 'Pagar'}
                        </button>

                        <Link
                            href="/planes-estandar"
                            className="text-center text-sm text-zinc-600 hover:text-zinc-900 transition-colors underline"
                        >
                            Seguir viendo planes
                        </Link>
                    </div>
                </div>
            </div>

            <LoginModal open={showLogin} onClose={() => setShowLogin(false)} returnTo="/carrito" />
        </div>
    )
}
