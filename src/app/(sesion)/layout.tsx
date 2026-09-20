import { SesionShell } from '@/shared'

// Layout compartido por las rutas de usuario con sesión iniciada (/panel, /perfil, /consulta/*, /pago/*,
// /ordenes/*). Es un route group ("(sesion)") por lo que no agrega ningún segmento a la URL. La
// sesión se valida en src/proxy.ts antes de que estas páginas se rendericen. El sidebar y el
// padding del contenido viven en SesionShell (arranca acoplado en /consulta/*, /pago/* y /ordenes/*).
export default function SesionLayout({ children }: { children: React.ReactNode }) {
    return <SesionShell>{children}</SesionShell>
}
