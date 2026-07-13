//next
import Link from "next/link";

export function Portada() {
  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center text-center px-6">
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/20" />

      <h1 className="relative text-white text-4xl md:text-6xl font-bold">
        Nutricionista Virtual
      </h1>
      <p className="relative text-white text-lg md:text-xl mt-4 max-w-2xl">
        Nuvi es un nutricionista virtual experto en nutrición deportiva. Entrenado por nutricionistas expertos en deporte y potenciado 
        por IA. Obten un plan nutricional como si fuese hecho por expertos a un bajisimo precio.
      </p>
      <Link
        href="/consulta/iniciar"
        className="relative mt-8 px-6 py-3 rounded-lg text-white font-semibold "
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        Iniciar consulta nutricional
      </Link>
    </div>
  )
}
