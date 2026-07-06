import Link from "next/link";

export function NavbarLanding() {
  return (
    <div className="absolute top-0 left-0 w-full z-20 flex items-center justify-between px-6 md:px-12 py-5 bg-transparent">
      <Link href="/" className="text-xl font-bold text-white">
        Nuvi - Nutricionista Virtual
      </Link>

      <nav className="flex items-center gap-4 md:gap-8">
        <Link href="#" className="hidden md:inline text-white font-medium hover:text-white/80">
          Sobre nosotros
        </Link>
        <Link href="#" className="hidden md:inline text-white font-medium hover:text-white/80">
          Blog
        </Link>
        <Link href="#" className="hidden md:inline text-white font-medium hover:text-white/80">
          Valores
        </Link>
        <Link
          href="/consulta/iniciar"
          className="px-4 py-2 rounded-lg text-white font-semibold"
          style={{ backgroundColor: '#4ed591' }}
        >
          Iniciar consulta nutricional
        </Link>
      </nav>
    </div>
  )
}
