'use client'
//next
import Link from "next/link";
import { usePathname } from "next/navigation";
//icons
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
//shared
import { SESION_NAV_ITEMS, SesionNavLink } from "./sesion-nav-link.component";
import { clearClientState } from "../auth/clear-client-state";

// Barra superior fija del área con sesión (h-15 = 60px, ancho completo): logo "Nuvi" (→ /inicio) a la izquierda y
// el botón "Nueva consulta" a la derecha. En pantallas chicas también aloja las opciones del sidebar
// (Inicio, Planes, Mediciones, Perfil, Cerrar sesión), porque NavbarSesion solo se muestra en md+.
export function TopbarSesion() {
    const pathname = usePathname();

    return (
        <header
            className="fixed left-0 top-0 z-20 w-full h-15 flex items-center justify-between gap-2 px-4 md:px-8
            bg-white/80 backdrop-blur-md border-b border-zinc-200"
        >
            <Link href="/inicio" className="text-2xl font-bold" style={{ color: "var(--color-secondary)" }}>
                Nuvi
            </Link>

            <nav aria-label="Menú de usuario" className="flex md:hidden items-center gap-1">
                {SESION_NAV_ITEMS.map((item) => (
                    <SesionNavLink key={item.href} {...item} isActive={pathname === item.href} compact />
                ))}
                <SesionNavLink
                    href="/api/cognito/logout"
                    hardNavigation
                    onClick={clearClientState}
                    label="Cerrar sesión"
                    icon={ArrowRightOnRectangleIcon}
                    compact
                />
            </nav>

            <Link
                href="/consulta/anamnesis"
                className="px-3 md:px-6 py-2 rounded-lg text-xs md:text-base font-medium text-white whitespace-nowrap"
                style={{ backgroundColor: "var(--color-primary)" }}
            >
                Nueva consulta
            </Link>
        </header>
    );
}
