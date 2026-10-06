'use client'
//next
import { usePathname } from "next/navigation";
//react
import { useEffect, useState } from "react";
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
    // Móvil: el menú es un panel que se abre/cierra desde el botón "menú" de TopbarSesion.
    mobileOpen?: boolean;
    onMobileClose?: () => void;
}

// id del <nav>: lo referencia el botón de menú de TopbarSesion (aria-controls)
export const SESION_NAV_ID = "sesion-nav";

// Menú de navegación para usuarios con sesión iniciada (/inicio, /planes, /mediciones, /perfil, /consulta/*, /pago/*,
// /ordenes/*), fijo a la izquierda, debajo de TopbarSesion (h-15). (Estas rutas no muestran NavbarLanding, ver
// navbar-landing-gate.component.tsx.)
//  - md+: sidebar siempre visible, desacoplado (w-56, con los links) o acoplado (w-14, sin links). Se
//    acopla/desacopla con el botón de flecha (16x32px) centrado sobre su borde derecho, o haciendo click en
//    cualquier parte del sidebar que no sea un link.
//  - Móvil: panel oculto fuera de la pantalla que se desliza al abrirlo con el botón "menú" de TopbarSesion
//    (`mobileOpen`). Se cierra con el mismo botón, al elegir una opción, al tocar el fondo o con Escape.
export function NavbarSesion({ collapsed = false, onToggle, mobileOpen = false, onMobileClose }: NavbarSesionProps) {
    const pathname = usePathname();
    // Mientras el mouse (o el foco) está sobre el botón se ilumina su borde y el borde derecho del sidebar.
    const [toggleHovered, setToggleHovered] = useState(false);
    // Cuando está acoplado se ocultan los links (solo en md+: el panel móvil siempre los muestra).
    const hideWhenCollapsed = collapsed ? "md:hidden" : "";
    const ToggleIcon = collapsed ? ChevronRightIcon : ChevronLeftIcon;
    const toggleLabel = collapsed ? "Desacoplar menú lateral" : "Acoplar menú lateral";
    const highlight = toggleHovered ? "var(--color-primary)" : undefined;

    // Click en el sidebar (incluido el botón, que burbuja hasta acá): alterna, salvo sobre los links.
    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
        if ((e.target as HTMLElement).closest("a")) return;
        onToggle?.();
    };

    // Panel móvil abierto: Escape lo cierra.
    useEffect(() => {
        if (!mobileOpen || !onMobileClose) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onMobileClose();
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [mobileOpen, onMobileClose]);

    return (
        <>
        {/* fondo del panel móvil: tocarlo cierra el menú */}
        {mobileOpen && (
            <div
                aria-hidden="true"
                data-testid="sesion-nav-backdrop"
                onClick={onMobileClose}
                className="md:hidden fixed inset-x-0 bottom-0 top-15 z-10 bg-black/30"
            />
        )}
        <nav
            id={SESION_NAV_ID}
            onClick={onToggle ? handleClick : undefined}
            className={`flex fixed left-0 top-15 z-10 w-56 px-4 ${collapsed ? "md:w-14 md:px-2" : ""} h-[calc(100vh-3.75rem)]
            flex-col items-stretch gap-2 py-6 ${onToggle ? "md:cursor-pointer" : ""}
            bg-white md:bg-white/80 md:backdrop-blur-md border-r border-zinc-200
            ${mobileOpen ? "translate-x-0 visible" : "-translate-x-full invisible"} md:translate-x-0 md:visible
            transition-[width,border-color,translate,visibility] duration-200`}
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
                    className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 items-center justify-center
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
                    onClick={onMobileClose}
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
        </>
    );
}
