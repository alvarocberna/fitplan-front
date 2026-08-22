//NEXT
import Image from 'next/image'
import Link from 'next/link'
//SHARED
import { PLANS } from '@/shared'

export default function Cart() {
  const items = PLANS.slice(0, 3)
  const subtotal = items.reduce((acc, item) => acc + item.price, 0)

  return (
    <div className="w-full min-h-screen flex flex-col items-center text-center px-6 pt-40 pb-20">
      {/* inner container */}
      <div className="w-[90%] md:w-[80%] mx-auto flex flex-col items-center">
        {/* title */}
        <h1 className="text-2xl md:text-4xl font-bold text-zinc-800 mb-12 self-start">
          Carro de compras
        </h1>

        <div className="w-full flex flex-col md:flex-row items-start gap-10">
          {/* left: items */}
          <div className="w-full md:w-[65%] flex flex-col gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="w-full flex items-center gap-4 border border-zinc-300 rounded-2xl p-4 text-left"
              >
                {/* image */}
                <div className="w-20 md:w-24 flex-shrink-0 border border-zinc-300 rounded-xl overflow-hidden">
                  <Image
                    src={item.imgUrl}
                    alt={item.title}
                    width={200}
                    height={283}
                    className="w-full h-auto"
                  />
                </div>
                {/* info */}
                <div className="flex-1 flex flex-col">
                  <p className="text-md font-semibold text-zinc-800">
                    {item.title}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {item.description[0]}
                  </p>
                </div>
                {/* quantity */}
                <div className="flex items-center gap-3 border border-zinc-300 rounded-full px-3 py-1">
                  <button className="text-zinc-600 hover:text-zinc-900 transition-colors">
                    −
                  </button>
                  <span className="text-sm text-zinc-800 w-4 text-center">1</span>
                  <button className="text-zinc-600 hover:text-zinc-900 transition-colors">
                    +
                  </button>
                </div>
                {/* price */}
                <p className="w-20 text-right font-semibold text-zinc-800">
                  ${item.price}
                </p>
                {/* remove */}
                <button className="text-zinc-400 hover:text-zinc-700 transition-colors">
                  ✕
                </button>
              </div>
            ))}

            {items.length === 0 && (
              <p className="text-zinc-500 text-left">Tu carro está vacío.</p>
            )}
          </div>

          {/* right: summary */}
          <div className="w-full md:w-[35%] border border-zinc-300 rounded-2xl p-6 text-left flex flex-col gap-4">
            <h2 className="text-lg font-bold text-zinc-800">Resumen</h2>

            <div className="flex flex-col gap-2 text-sm text-zinc-600">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>${subtotal}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Descuentos</span>
                <span>$0</span>
              </div>
            </div>

            <div className="border-t border-zinc-300 pt-4 flex items-center justify-between">
              <span className="font-semibold text-zinc-800">Total</span>
              <span className="text-xl font-bold text-zinc-800">${subtotal}</span>
            </div>

            <button
              className="mt-2 w-full py-2.5 rounded-full text-white font-semibold hover:opacity-90 transition-opacity"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Pagar
            </button>

            <Link
              href="/plans"
              className="text-center text-sm text-zinc-600 hover:text-zinc-900 transition-colors underline"
            >
              Seguir viendo planes
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
