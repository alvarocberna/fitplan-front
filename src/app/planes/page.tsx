'use client'
//NEXT
import Image from 'next/image'
import Link from 'next/link'
//SHARED
import { PLANES } from '@/shared'

export default function Planes() {
  return (
    <div className="w-full min-h-screen flex flex-col items-center text-center px-6 pt-40 pb-20">
      {/* inner container */}
      <div className="w-[90%] md:w-[80%] mx-auto flex flex-col items-center">
        {/* title */}
        <h1 className="text-2xl md:text-4xl font-bold text-zinc-800 mb-6">
          Todos los planes
        </h1>
        {/* text */}
        <p className="max-w-2xl text-md md:text-md mb-16 text-zinc-800">
          Descubre todos los planes pre elaborados según el deporte practicado y el objetivo que deseas alcanzar,
          sin necesidad de realizar la consulta personalizada.
        </p>
        {/* grilla de planes */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-12">
          {PLANES.map((plan) => (
            <div key={plan.id} className="px-8 md:px-16">
              <p className="text-md text-zinc-800 font-semibold mb-2">
                {plan.titulo}
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
                    href="/carro"
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
    </div>
  )
}
