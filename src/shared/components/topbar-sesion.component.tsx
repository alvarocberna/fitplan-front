'use client'
//next
import Link from "next/link";
//icons
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
//shared
import { SESION_NAV_ID } from "./navbar-sesion.component";

interface TopbarSesionProps {
    // Estado del panel de navegación en móvil (NavbarSesion) y cómo alternarlo.
    menuOpen?: boolean;
    onMenuToggle?: () => void;
}

// Barra superior fija del área con sesión (h-15 = 60px, ancho completo): logo "Nuvi" (→ /inicio) a la izquierda y
// el botón "Nueva consulta" a la derecha. En pantallas chicas muestra además, antes del logo, el botón "menú"
// que abre/cierra el panel de navegación (NavbarSesion), donde viven Inicio, Planes, Mediciones, Perfil y
// Cerrar sesión.
export function TopbarSesion({ menuOpen = false, onMenuToggle }: TopbarSesionProps) {
    const MenuIcon = menuOpen ? XMarkIcon : Bars3Icon;
    const menuLabel = menuOpen ? "Cerrar menú" : "Abrir menú";

    return (
        <header
            className="fixed left-0 top-0 z-20 w-full h-15 flex items-center justify-between gap-2 px-4 md:px-8
            bg-white/80 backdrop-blur-md border-b border-zinc-200"
        >
            <div className="flex items-center gap-2">
                {onMenuToggle && (
                    <button
                        type="button"
                        onClick={onMenuToggle}
                        aria-label={menuLabel}
                        aria-expanded={menuOpen}
                        aria-controls={SESION_NAV_ID}
                        className="md:hidden flex items-center justify-center w-10 h-10 -ml-2 rounded-lg cursor-pointer text-zinc-700 hover:bg-zinc-100"
                    >
                        <MenuIcon className="w-6 h-6" />
                    </button>
                )}
                <Link href="/inicio" className="text-2xl font-bold" style={{ color: "var(--color-secondary)" }}>
                    Nuvi
                </Link>
            </div>

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
