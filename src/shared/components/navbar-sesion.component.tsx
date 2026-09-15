'use client'
//next
import Link from "next/link";
import { usePathname } from "next/navigation";
//icons
import { UserIcon, Squares2X2Icon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";

interface NavItem {
    href: string;
    label: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const NAV_ITEMS: NavItem[] = [
    { href: "/panel", label: "Panel", icon: Squares2X2Icon },
    { href: "/perfil", label: "Perfil", icon: UserIcon },
];

// Sidebar para usuarios con sesión iniciada (/panel, /perfil, ...). En md+ queda fija a la
// izquierda; en pantallas chicas se convierte en una barra horizontal fija bajo el navbar público
// (NavbarLanding, ver src/app/layout.tsx), que se renderiza en todas las páginas.
export function NavbarSesion() {
    const pathname = usePathname();

    return (
        <nav
            className="fixed left-0 top-16 md:top-24 z-10 w-full md:w-56 md:h-[calc(100%-6rem)]
            flex flex-row md:flex-col items-center md:items-stretch justify-around md:justify-start
            gap-1 md:gap-2 px-2 md:px-4 py-2 md:py-6
            bg-white/80 md:bg-white/60 backdrop-blur-md border-b md:border-b-0 md:border-r border-white/40"
        >
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                    <Link
                        key={href}
                        href={href}
                        className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
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
                className="flex flex-col md:flex-row items-center gap-1 md:gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-100 md:mt-auto"
            >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                <span>Cerrar sesión</span>
            </Link>
        </nav>
    );
}
