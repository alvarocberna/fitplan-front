//next
import Link from "next/link";

export function NavbarLanding() {
  return (
    <div className="absolute top-0 left-0 w-full z-20 flex items-center justify-between px-6 md:px-12 py-5 bg-transparent">
      <Link href="/" className="text-xl text-zinc-700">
        Nuvi - Nutricionista Virtual
      </Link>

      <nav className="flex items-center gap-4 md:gap-8">
        <Link href="#" className="hidden md:inline text-zinc-700 font-medium hover:text-zinc-700/80">
          Blog
        </Link>
        <Link href="#" className="hidden md:inline text-zinc-700 font-medium hover:text-zinc-700/80">
          Opiniones
        </Link>
        <Link href="#" className="hidden md:inline text-zinc-700 font-medium hover:text-zinc-700/80">
          Planes Estandar
        </Link>
        <Link
          href="/consulta/iniciar-consulta"
          className="px-6 py-2 rounded-lg text-white"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          Iniciar Consulta
        </Link>
      </nav>
    </div>
  )
}
