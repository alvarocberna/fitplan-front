//fontawesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGoogle } from '@fortawesome/free-brands-svg-icons'

interface LoginOptionsProps {
    //ruta a la que volver tras iniciar sesión (solo las permitidas en shared/auth/return-to.ts); sin ella,
    //el destino lo decide el callback según el estado del perfil
    returnTo?: string
}

function loginHref(params: Record<string, string>, returnTo?: string): string {
    const query = new URLSearchParams(params)
    if (returnTo) query.set('return_to', returnTo)
    const queryString = query.toString()
    return `/api/cognito/login${queryString ? `?${queryString}` : ''}`
}

// Las tres formas de entrar (Google, registro con correo, inicio de sesión), compartidas por la página
// /login y por el modal de registro que aparece al pagar sin sesión: es un mismo bloque, no dos copias.
export function LoginOptions({ returnTo }: LoginOptionsProps) {
    return (
        <div className="flex flex-col gap-3 mt-6">
            <a
                href={loginHref({ identity_provider: 'Google' }, returnTo)}
                className="flex items-center justify-center gap-2 w-[60%] mx-auto px-8 py-2 rounded-lg text-center font-semibold border border-zinc-300"
            >
                <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    <FontAwesomeIcon icon={faGoogle} className="w-full h-full" />
                </div>
                Continuar con Google
            </a>

            <p className="text-zinc-500 text-sm text-center my-1">o con tu correo</p>

            <a
                href={loginHref({ screen_hint: 'signup' }, returnTo)}
                className="block w-[60%] mx-auto px-8 py-2 rounded-lg text-white font-semibold text-center"
                style={{ backgroundColor: 'var(--color-primary)' }}
            >
                Registro
            </a>
            <a
                href={loginHref({}, returnTo)}
                className="block w-[60%] mx-auto px-8 py-2 rounded-lg text-center font-semibold border"
                style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
            >
                Inicio de sesión
            </a>
        </div>
    )
}
