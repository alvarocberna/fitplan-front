'use client'
//next
import Link from "next/link";
import { usePathname } from "next/navigation";
//icons
import {
    UserIcon,
    Squares2X2Icon,
    ArrowRightOnRectangleIcon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
} from "@heroicons/react/24/outline";

interface NavItem {
    href: string;
    label: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const NAV_ITEMS: NavItem[] = [
    { href: "/panel", label: "Panel", icon: Squares2X2Icon },
    { href: "/perfil", label: "Perfil", icon: UserIcon },
];

interface NavbarSesionProps {
    // md+: sidebar acoplado (angosto, solo el ícono para desacoplarlo). En pantallas chicas se
    // ignora: la barra superior siempre se muestra completa.
    collapsed?: boolean;
    onToggle?: () => void;
}

// Sidebar para usuarios con sesión iniciada (/panel, /perfil, /consulta/*, /ordenes/*). En md+
// queda fija a la izquierda ocupando toda la altura, desacoplado (w-56, con los links) o acoplado
// (w-14, solo el botón para desacoplar); en pantallas chicas se convierte en una barra horizontal
// fija en el borde superior (estas rutas no muestran NavbarLanding, ver
// navbar-landing-gate.component.tsx).
export function NavbarSesion({ collapsed = false, onToggle }: NavbarSesionProps) {
    const pathname = usePathname();
    // Cuando está acoplado, en md+ se ocultan los links (en móvil siguen visibles en la barra).
    const hideWhenCollapsed = collapsed ? "md:hidden" : "";
    const ToggleIcon = collapsed ? ChevronDoubleRightIcon : ChevronDoubleLeftIcon;
    const toggleLabel = collapsed ? "Desacoplar menú lateral" : "Acoplar menú lateral";

    return (
        <nav
            className={`fixed left-0 top-0 z-10 w-full ${collapsed ? "md:w-14" : "md:w-56"} md:h-screen
            flex flex-row md:flex-col items-center md:items-stretch justify-around md:justify-start
            gap-1 md:gap-2 ${collapsed ? "md:px-2" : "md:px-4"} px-2 py-2 md:py-6
            bg-white/80 md:bg-white/60 backdrop-blur-md border-b md:border-b-0 md:border-r border-white/40
            transition-[width] duration-200`}
        >
            {onToggle && (
                <button
                    type="button"
                    onClick={onToggle}
                    aria-label={toggleLabel}
                    title={toggleLabel}
                    aria-expanded={!collapsed}
                    className={`hidden md:flex items-center ${collapsed ? "justify-center" : "justify-end"} px-3 py-2 rounded-lg text-zinc-700 hover:bg-zinc-100 transition-colors`}
                >
                    <ToggleIcon className="w-5 h-5" />
                </button>
            )}

            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                    <Link
                        key={href}
                        href={href}
                        className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${hideWhenCollapsed}
                        ${isActive ? "text-white" : "text-zinc-700 hover:bg-zinc-100"}`}
                        style={isActive ? { backgroundColor: "var(--color-primary)" } : undefined}
                    >
                        <Icon className="w-5 h-5" />
                        <span>{label}</span>
                    </Link>
                );
            })}

            <Link
                href="/api/cognito/logout"
                className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-100 md:mt-auto ${hideWhenCollapsed}`}
            >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                <span>Cerrar sesión</span>
            </Link>
        </nav>
    );
}
