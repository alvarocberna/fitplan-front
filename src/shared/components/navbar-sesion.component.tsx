'use client'
//next
import { usePathname } from "next/navigation";
//react
import { useState } from "react";
//icons
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/16/solid";
//shared
import { SESION_NAV_ITEMS, SesionNavLink } from "./sesion-nav-link.component";
import { clearClientState } from "../auth/clear-client-state";

interface NavbarSesionProps {
    // Sidebar acoplado (angosto, sin links) o desacoplado (con los links).
    collapsed?: boolean;
    onToggle?: () => void;
}

// Sidebar para usuarios con sesión iniciada (/inicio, /planes, /mediciones, /perfil, /consulta/*, /pago/*, /ordenes/*). Solo
// existe en md+: fija a la izquierda, debajo de TopbarSesion (h-15), desacoplado (w-56, con los
// links) o acoplado (w-14, sin links). Se acopla/desacopla con el botón de flecha (16x32px) centrado
// sobre su borde derecho, o haciendo click en cualquier parte del sidebar que no sea un link. En
// pantallas chicas no se renderiza: sus opciones viven en la barra superior (estas rutas no muestran
// NavbarLanding, ver navbar-landing-gate.component.tsx).
export function NavbarSesion({ collapsed = false, onToggle }: NavbarSesionProps) {
    const pathname = usePathname();
    // Mientras el mouse (o el foco) está sobre el botón se ilumina su borde y el borde derecho del sidebar.
    const [toggleHovered, setToggleHovered] = useState(false);
    // Cuando está acoplado se ocultan los links.
    const hideWhenCollapsed = collapsed ? "hidden" : "";
    const ToggleIcon = collapsed ? ChevronRightIcon : ChevronLeftIcon;
    const toggleLabel = collapsed ? "Desacoplar menú lateral" : "Acoplar menú lateral";
    const highlight = toggleHovered ? "var(--color-primary)" : undefined;

    // Click en el sidebar (incluido el botón, que burbuja hasta acá): alterna, salvo sobre los links.
    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
        if ((e.target as HTMLElement).closest("a")) return;
        onToggle?.();
    };

    return (
        <nav
            onClick={onToggle ? handleClick : undefined}
            className={`hidden md:flex fixed left-0 top-15 z-10 ${collapsed ? "w-14 px-2" : "w-56 px-4"} h-[calc(100vh-3.75rem)]
            flex-col items-stretch gap-2 py-6 ${onToggle ? "cursor-pointer" : ""}
            bg-white/80 backdrop-blur-md border-r border-zinc-200
            transition-[width,border-color] duration-200`}
            style={{ borderRightColor: highlight }}
        >
            {onToggle && (
                // Sin onClick propio: el click burbuja a handleClick del <nav> (evita alternar dos veces).
                <button
                    type="button"
                    aria-label={toggleLabel}
                    title={toggleLabel}
                    aria-expanded={!collapsed}
                    onMouseEnter={() => setToggleHovered(true)}
                    onMouseLeave={() => setToggleHovered(false)}
                    onFocus={() => setToggleHovered(true)}
                    onBlur={() => setToggleHovered(false)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 flex items-center justify-center
                    w-4 h-8 p-0 cursor-pointer rounded-sm bg-white border border-zinc-200 text-zinc-700 transition-colors"
                    style={{ borderColor: highlight }}
                >
                    <ToggleIcon className="w-3 h-3" />
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
                hardNavigation
                onClick={clearClientState}
                label="Cerrar sesión"
                icon={ArrowRightOnRectangleIcon}
                className={`mt-auto ${hideWhenCollapsed}`}
            />
        </nav>
    );
}
