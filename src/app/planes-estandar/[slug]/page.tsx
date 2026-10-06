'use client'
//next
import Link from 'next/link'
import { useParams, useRouter, notFound } from 'next/navigation'
//shared
import { PLANS, usePlanSelection, buildPlanCode } from '@/shared'
//features - plans
import { PlanSelectionFields } from '@/features/plans/components/plan-selection-fields.component'
import { PlanPreviewImage } from '@/features/plans/components/plan-preview-image.component'
import { usePredefinedProduct } from '@/features/plans/hooks/use-predefined-product'
import { formatPrice } from '@/features/plans/format-price'

export default function PlanDetail() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const plan = PLANS.find(p => p.slug === slug)
  const { selection, addToCart } = usePlanSelection()

  //versión del plan que corresponde a lo que completó el usuario (null mientras falte algún dato)
  const code = buildPlanCode(slug, selection)
  const { status, product } = usePredefinedProduct(code)

  if (!plan) return notFound()

  const onAddToCart = () => {
    if (!code || status !== 'ready') return
    //un solo plan por compra: reemplaza lo que hubiera en el carro
    addToCart({ planSlug: plan.slug, code })
    router.push('/carrito')
  }

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center text-center px-6 pt-40 pb-20">
      <div className="w-[90%] md:w-[80%] mx-auto flex flex-col-reverse md:flex-row items-start justify-between">
        {/* left */}
        <div className="w-full md:w-[50%] rounded-2xl overflow-hidden">
          <div className='w-[60%] mx-auto border border-zinc-300 rounded-2xl'>
            <PlanPreviewImage
              thumbnailUrl={product?.thumbnailUrl ?? null}
              fallbackSrc={plan.imgUrl}
              alt={plan.title}
            />
          </div>
        </div>
        {/* right */}
        <div className='w-full md:w-[50%] flex flex-col items-start'>
          <h1 className="text-2xl md:text-4xl font-bold text-zinc-800 mb-4">
            {plan.title}
          </h1>
          <div className="max-w-xl text-md text-zinc-800 mb-6 list-disc list-inside space-y-1">
            {plan.description.map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>

          {/* datos con los que el sistema elige la versión del plan */}
          <div className="w-full max-w-sm mb-6">
            <PlanSelectionFields />
          </div>

          <p className="text-xl font-semibold text-zinc-800 mb-2">
            {status === 'ready' && formatPrice(product.price, product.currency)}
            {status === 'loading' && <span className="text-zinc-400 text-base">Buscando tu plan...</span>}
          </p>
          {status === 'idle' && (
            <p className="mb-6 text-sm text-zinc-500 text-left">
              Completa tus datos para ver el plan más adecuado para ti.
            </p>
          )}
          {status === 'unavailable' && (
            <p role="alert" className="mb-6 text-sm text-red-500 text-left">
              Esta versión del plan aún no está disponible.
            </p>
          )}
          {(status === 'ready' || status === 'loading') && <div className="mb-6" />}

          <button
            type="button"
            onClick={onAddToCart}
            disabled={status !== 'ready'}
            className="px-6 py-2 rounded-full text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Añadir al carro
          </button>
          <Link href="/planes-estandar" className="mt-4 text-sm text-zinc-600 hover:text-zinc-900 underline">
            Ver todos los planes
          </Link>
        </div>
      </div>
    </div>
  )
}
