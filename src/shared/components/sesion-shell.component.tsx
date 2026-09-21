'use client'
//next
import { usePathname } from "next/navigation";
//react
import { useState } from "react";
//shared
import { NavbarSesion } from "./navbar-sesion.component";
import { TopbarSesion } from "./topbar-sesion.component";
import { Footer } from "./footer.component";
import { isFocusRoute } from "@/shared/auth/sesion-routes";

// Elección manual del usuario (acoplar/desacoplar) en la sección actual. `focus` indica de qué
// sección es (flujo /consulta/* + /pago/* + /ordenes/* vs /panel + /perfil); `override` es null mientras el
// usuario no haya tocado el botón. Al cambiar de sección la elección se descarta y vuelve a valer
// el valor por defecto de la nueva; dentro de una misma sección se mantiene entre páginas porque el
// layout no se vuelve a montar.
interface CollapseState {
    focus: boolean;
    override: boolean | null;
}

// Cáscara del layout `(sesion)`: barra superior + sidebar (md+) + contenido con el padding que
// corresponde al alto de la barra y al ancho actual del sidebar. Es un Client Component solo porque el estado acoplado/desacoplado debe compartirse
// entre NavbarSesion y el <main>; las páginas (`children`) siguen siendo Server Components.
export function SesionShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const focus = isFocusRoute(pathname);
    const [state, setState] = useState<CollapseState>({ focus, override: null });

    // Cambio de sección: se descarta la elección manual. Se ajusta el estado durante el render (en
    // vez de en un efecto) para no mostrar un frame con el ancho de la sección anterior.
    let current = state;
    if (state.focus !== focus) {
        current = { focus, override: null };
        setState(current);
    }

    // por defecto: acoplado en el flujo de consulta/órdenes, desacoplado en /panel y /perfil
    const collapsed = current.override ?? focus;

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--color-sesion-background)' }}>
            <TopbarSesion />
            <NavbarSesion
                collapsed={collapsed}
                onToggle={() => setState({ focus, override: !collapsed })}
            />
            <main
                className={`pt-19 md:pt-23 pb-16 ${collapsed ? "md:pl-14" : "md:pl-56"} min-h-screen transition-[padding] duration-200`}
            >
                {children}
            </main>
            {/* mismo padding lateral que <main>: el sidebar es fixed y taparía el borde izquierdo del footer */}
            <div className={`${collapsed ? "md:pl-14" : "md:pl-56"} transition-[padding] duration-200`}>
                <Footer />
            </div>
        </div>
    )
}
