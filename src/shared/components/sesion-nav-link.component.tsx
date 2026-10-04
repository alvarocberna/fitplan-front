//next
import Link from "next/link";
//icons
import {
    UserIcon,
    Squares2X2Icon,
    DocumentTextIcon,
    ChartBarIcon,
} from "@heroicons/react/24/outline";

type NavIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

export interface SesionNavItem {
    href: string;
    label: string;
    icon: NavIcon;
}

// Opciones de navegación del área con sesión, compartidas por el sidebar (md+) y la barra superior
// (móvil). "Cerrar sesión" no está aquí: no es una ruta, es el endpoint de logout.
export const SESION_NAV_ITEMS: SesionNavItem[] = [
    { href: "/inicio", label: "Inicio", icon: Squares2X2Icon },
    { href: "/planes", label: "Planes", icon: DocumentTextIcon },
    { href: "/mediciones", label: "Mediciones", icon: ChartBarIcon },
    { href: "/perfil", label: "Perfil", icon: UserIcon },
];

interface SesionNavLinkProps extends SesionNavItem {
    isActive?: boolean;
    // Variante para la barra superior en móvil: ícono sobre la etiqueta, sin rectángulo lateral.
    compact?: boolean;
    className?: string;
    // true para un href que no es una página sino un endpoint (el logout): se renderiza un <a> común
    // en vez de <Link>, para que sea una navegación real del navegador. Con <Link> el router de Next
    // lo pediría (y lo precargaría) por fetch, y el endpoint solo cierra la sesión ante una navegación.
    hardNavigation?: boolean;
    onClick?: () => void;
}

// Link de navegación con ícono. Activo: texto en color primary y, en el sidebar, un rectángulo de
// 5px pegado al borde izquierdo con el alto del link.
export function SesionNavLink({ href, label, icon: Icon, isActive = false, compact = false, className = "", hardNavigation = false, onClick }: SesionNavLinkProps) {
    const layout = compact
        ? "flex-col gap-0.5 px-2 py-1 text-[11px]"
        : "flex-row gap-3 px-3 py-2 text-sm";

    const Anchor = hardNavigation ? "a" : Link;

    return (
        <Anchor
            href={href}
            onClick={onClick}
            className={`relative flex items-center rounded-lg font-medium transition-colors ${layout}
            ${isActive ? "" : "text-zinc-700 hover:bg-zinc-100"} ${className}`}
            style={isActive ? { color: "var(--color-primary)" } : undefined}
        >
            {isActive && !compact && (
                <span
                    aria-hidden="true"
                    data-testid="nav-active-indicator"
                    className="absolute left-0 inset-y-0 w-[5px] rounded-full"
                    style={{ backgroundColor: "var(--color-primary)" }}
                />
            )}
            <Icon className="w-5 h-5" />
            <span>{label}</span>
        </Anchor>
    );
}
