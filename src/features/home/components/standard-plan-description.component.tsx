'use client'
//REACT
import { useEffect, useRef, useState } from 'react'
//NEXT
import Image from 'next/image'
import Link from 'next/link'
//GSAP
import { gsap } from 'gsap'
//SHARED
import { PLANS } from '@/shared';

const VISIBLE = 3
const INTERVAL_MS = 3000

export function StandardPlanDescription() {
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const indexRef = useRef(0)
  const [slides] = useState(() => [...PLANS, ...PLANS.slice(0, VISIBLE)])

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

      if (indexRef.current === PLANS.length) {
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
  }, [])

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
            {slides.map((plan, i) => (
              <div key={`${plan.id}-${i}`} className="w-1/3 flex-shrink-0 px-16">
                <p className='text-md text-zinc-800 font-semibold mb-2'>
                  {plan.title}
                </p>
                <div className="relative overflow-hidden border border-zinc-400 rounded-2xl group">
                  <Image
                    src={plan.imgUrl}
                    alt="img informe"
                    width={1241}
                    height={1755}
                    className="w-full h-auto rounded-2xl"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <Link
                      href={`/planes/${plan.slug}`}
                      className="w-36 px-4 py-1.5 rounded-full bg-white text-zinc-800 text-sm font-semibold text-center hover:bg-zinc-100 transition-colors"
                    >
                      Ver más
                    </Link>
                    <Link
                      href="/carrito"
                      className="w-36 px-4 py-1.5 rounded-full text-white text-sm font-semibold text-center hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      Añadir al carro
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* ver mas */}
        <Link 
            href={`/planes`}
            className="mt-8 px-6 py-2 rounded-full border border-zinc-800 text-zinc-800 font-semibold hover:bg-zinc-800 hover:text-white transition-colors">
          Ver más
        </Link>
      </div>
    </div>
  )
}
