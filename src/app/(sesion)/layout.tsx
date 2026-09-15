import { NavbarSesion } from '@/shared'

// Layout compartido por las rutas de usuario con sesión iniciada (/panel, /perfil, ...). Es un
// route group ("(sesion)") por lo que no agrega ningún segmento a la URL. La sesión ya se valida
// en src/proxy.ts (PROTECTED_PATHS) antes de que estas páginas se rendericen.
export default function SesionLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen">
            <NavbarSesion />
            <main className="pt-32 pb-16 md:pl-56 min-h-screen">
                {children}
            </main>
        </div>
    )
}
