//next
import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/#consulta-nutricional-virtual", label: "Consulta Virtual" },
  { href: "/#plan-personal", label: "Plan Personal" },
  { href: "/#plan-estandarizado-por-disciplina", label: "Planes Estandar" },
];

// Pie de página común a todas las rutas. Fuera del área con sesión lo monta el layout raíz vía
// FooterGate; dentro de ella lo monta SesionShell (con el padding del sidebar). Ver
// footer-gate.component.tsx.
export function Footer() {
  return (
    <footer className="w-full px-6 md:px-12 py-8 bg-white border-t border-zinc-200">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">
        <Link href="/" className="text-lg font-bold" style={{ color: "var(--color-secondary)" }}>
          Nuvi - Nutricionista Virtual
        </Link>

        <nav aria-label="Enlaces del pie de página" className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="text-sm text-zinc-500">© {new Date().getFullYear()} Nuvi. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
