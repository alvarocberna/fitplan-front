'use client'
//NEXT
import Image from 'next/image'
import Link from 'next/link'
import { useParams, notFound } from 'next/navigation'
//SHARED
import { PLANS } from '@/shared'

export default function PlanDetail() {
  const { slug } = useParams<{ slug: string }>()
  const plan = PLANS.find(p => p.slug === slug)

  if (!plan) return notFound()

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center text-center px-6 pt-40 pb-20">
      <div className="w-[90%] md:w-[80%] mx-auto flex flex-col-reverse md:flex-row items-start justify-between">
        {/* left */}
        <div className="w-full md:w-[50%] rounded-2xl overflow-hidden">
          <div className='w-[60%] mx-auto border border-zinc-300 rounded-2xl'>
            <Image
              src={plan.imgUrl}
              alt={plan.title}
              width={620}
              height={877}
              className="w-full h-auto rounded-2xl"
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
          <p className="text-xl font-semibold text-zinc-800 mb-8">
            ${plan.price}
          </p>
          <Link
            href="/cart"
            className="px-6 py-2 rounded-full text-white font-semibold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Añadir al carro
          </Link>
        </div>
      </div>
    </div>
  )
}
