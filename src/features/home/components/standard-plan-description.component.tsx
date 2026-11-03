'use client'
//REACT
import { useEffect, useMemo, useRef } from 'react'
//NEXT
import Link from 'next/link'
//GSAP
import { gsap } from 'gsap'
//SHARED
import { PLANS, usePlanSelection } from '@/shared';
//features - plans (import directo, no por el barrel: ver "Barrel gotcha" en CLAUDE.md)
import { usePlanPreviews } from '@/features/plans/hooks/use-plan-previews'
import { PlanPreviewImage } from '@/features/plans/components/plan-preview-image.component'

const VISIBLE = 3
const INTERVAL_MS = 3000

interface CarouselItem {
  code: string
  title: string
  thumbnailUrl: string | null
  fallbackSrc: string
}

//catálogo estático como respaldo (mientras carga la vista previa de la BD, o si falla): mismo
//criterio que ya usa PlanPreviewImage por ítem (miniatura real si existe, si no la imagen fija)
const STATIC_ITEMS: CarouselItem[] = PLANS.map((plan) => ({
  code: plan.slug,
  title: plan.title,
  thumbnailUrl: null,
  fallbackSrc: plan.imgUrl,
}))

export function StandardPlanDescription() {
  const { openSelectionModal } = usePlanSelection()
  const previewsState = usePlanPreviews()
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const indexRef = useRef(0)

  //título + miniatura real desde la BD una vez lista; mientras carga o si falla, el catálogo
  //estático (así el carrusel nunca queda vacío por un hiccup del backend)
  const items: CarouselItem[] =
    previewsState.status === 'ready'
      ? previewsState.previews.map((preview) => ({
          code: preview.code,
          title: preview.name,
          thumbnailUrl: preview.thumbnailUrl,
          fallbackSrc:
            STATIC_ITEMS.find((item) => item.code === preview.code)?.fallbackSrc ??
            STATIC_ITEMS[0].fallbackSrc,
        }))
      : STATIC_ITEMS

  const slides = useMemo(() => [...items, ...items.slice(0, VISIBLE)], [items])

  useEffect(() => {
    const container = containerRef.current
    const track = trackRef.current
    if (!container || !track) return

    const goToIndex = (index: number, animate: boolean) => {
      const itemWidth = container.clientWidth / VISIBLE
      if (animate) {
        gsap.to(track, {
          x: -index * itemWidth,
          duration: 1,
          ease: 'power2.inOut',
        })
      } else {
        gsap.set(track, { x: -index * itemWidth })
      }
    }

    const interval = setInterval(() => {
      indexRef.current += 1
      goToIndex(indexRef.current, true)

      if (indexRef.current === items.length) {
        setTimeout(() => {
          indexRef.current = 0
          goToIndex(0, false)
        }, 1000)
      }
    }, INTERVAL_MS)

    const onResize = () => goToIndex(indexRef.current, false)
    window.addEventListener('resize', onResize)

    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', onResize)
    }
    //depende de la cantidad de ítems (no de la referencia de `items`, que cambia cada vez que
    //recalcula el respaldo/BD): si la cantidad no cambió (hoy siempre 4), el carrusel sigue
    //girando sin reiniciarse justo cuando llegan los datos reales.
     
  }, [items.length])

  return (
    <div id="plan-estandarizado-por-disciplina" className="w-full min-h-screen flex flex-col items-center justify-center text-center px-6 mb-20">
      {/* inner container */}
      <div className="w-[90%] md:w-[80%] mx-auto flex flex-col items-center ">
        {/* title */}
        <h2 className="text-2xl md:text-4xl font-bold text-zinc-800 mb-6">
          Plan estandarizado por disciplina
        </h2>
        {/* text */}
        <p className="max-w-2xl text-md md:text-md mb-16 text-zinc-800">
          También puedes obtener planes pre elaborados según el deporte practicado y el objetivo que deseas alcanzar,
          sin necesidad de realizar la consulta personalizada.
        </p>
        {/* carrusel de planes */}
        <div ref={containerRef} className="w-full overflow-hidden">
          <div ref={trackRef} className="flex">
            {slides.map((item, i) => (
              <div key={`${item.code}-${i}`} className="w-1/3 flex-shrink-0 px-16">
                <p className='text-md text-zinc-800 font-semibold mb-2'>
                  {item.title}
                </p>
                <div className="relative overflow-hidden border border-zinc-400 rounded-2xl group">
                  <PlanPreviewImage
                    thumbnailUrl={item.thumbnailUrl}
                    fallbackSrc={item.fallbackSrc}
                    alt={item.title}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <Link
                      href={`/planes-estandar/${item.code}`}
                      className="w-36 px-4 py-1.5 rounded-full bg-white text-zinc-800 text-sm font-semibold text-center hover:bg-zinc-100 transition-colors"
                    >
                      Ver más
                    </Link>
                    <button
                      type="button"
                      onClick={() => openSelectionModal(item.code)}
                      className="w-36 px-4 py-1.5 rounded-full text-white text-sm font-semibold text-center hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      Seleccionar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* ver mas */}
        <Link
            href={`/planes-estandar`}
            className="mt-8 px-6 py-2 rounded-full border border-zinc-800 text-zinc-800 font-semibold hover:bg-zinc-800 hover:text-white transition-colors">
          Ver más
        </Link>
      </div>
    </div>
  )
}
