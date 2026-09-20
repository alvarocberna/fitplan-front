'use client'
//next
import { usePathname } from "next/navigation";
//icons
import {
    ArrowRightOnRectangleIcon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
} from "@heroicons/react/24/outline";
//shared
import { SESION_NAV_ITEMS, SesionNavLink } from "./sesion-nav-link.component";

interface NavbarSesionProps {
    // Sidebar acoplado (angosto, solo el ícono para desacoplarlo) o desacoplado (con los links).
    collapsed?: boolean;
    onToggle?: () => void;
}

// Sidebar para usuarios con sesión iniciada (/panel, /perfil, /consulta/*, /pago/*, /ordenes/*). Solo
// existe en md+: fija a la izquierda, debajo de TopbarSesion (h-15), desacoplado (w-56, con los
// links) o acoplado (w-14, solo el botón para desacoplarlo). En pantallas chicas no se renderiza:
// sus opciones viven en la barra superior (estas rutas no muestran NavbarLanding, ver
// navbar-landing-gate.component.tsx).
export function NavbarSesion({ collapsed = false, onToggle }: NavbarSesionProps) {
    const pathname = usePathname();
    // Cuando está acoplado se ocultan los links; solo queda el botón para desacoplar.
    const hideWhenCollapsed = collapsed ? "hidden" : "";
    const ToggleIcon = collapsed ? ChevronDoubleRightIcon : ChevronDoubleLeftIcon;
    const toggleLabel = collapsed ? "Desacoplar menú lateral" : "Acoplar menú lateral";

    return (
        <nav
            className={`hidden md:flex fixed left-0 top-15 z-10 ${collapsed ? "w-14 px-2" : "w-56 px-4"} h-[calc(100vh-3.75rem)]
            flex-col items-stretch gap-2 py-6
            bg-white/80 backdrop-blur-md border-r border-zinc-200
            transition-[width] duration-200`}
        >
            {onToggle && (
                <button
                    type="button"
                    onClick={onToggle}
                    aria-label={toggleLabel}
                    title={toggleLabel}
                    aria-expanded={!collapsed}
                    className={`flex items-center ${collapsed ? "justify-center" : "justify-end"} px-3 py-2 rounded-lg text-zinc-700 hover:bg-zinc-100 transition-colors`}
                >
                    <ToggleIcon className="w-5 h-5" />
                </button>
            )}

            {SESION_NAV_ITEMS.map((item) => (
                <SesionNavLink
                    key={item.href}
                    {...item}
                    isActive={pathname === item.href}
                    className={hideWhenCollapsed}
                />
            ))}

            <SesionNavLink
                href="/api/cognito/logout"
                label="Cerrar sesión"
                icon={ArrowRightOnRectangleIcon}
                className={`mt-auto ${hideWhenCollapsed}`}
            />
        </nav>
    );
}
