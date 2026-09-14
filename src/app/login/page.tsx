//fontawesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGoogle } from '@fortawesome/free-brands-svg-icons'
//shared
import {Card, SubsectionHead, SubsectionTitle} from '@/shared'

const ERROR_MESSAGES: Record<string, string> = {
  callback_failed: 'No pudimos completar tu inicio de sesión. Intenta de nuevo.',
}

export default async function ConsultaLogin({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { error } = await searchParams
  const errorMessage = typeof error === 'string' ? ERROR_MESSAGES[error] : undefined

  return (
    <div className="w-full min-h-screen py-24">
      <div className="max-w-2xl flex flex-col mx-auto" >
      <Card widthInner='90%'>
        <SubsectionHead>
          <SubsectionTitle mb={2} title="Registrate para continuar"/>
          <p className="text-zinc-900 text-md">
            solo tomará 30 segundos
          </p>
        </SubsectionHead>

        {errorMessage && (
          <p role="alert" className="text-red-400 text-sm text-center mb-4">
            {errorMessage}
          </p>
        )}

        <div className="flex flex-col gap-3 mt-6">
          <a
            href="/api/cognito/login?identity_provider=Google"
            className="flex items-center justify-center gap-2 w-[60%] mx-auto px-8 py-2 rounded-lg text-center font-semibold border border-zinc-300"
          >
            <FontAwesomeIcon icon={faGoogle} />
            Continuar con Google
          </a>

          <p className="text-zinc-500 text-sm text-center my-1">o con tu correo</p>

          <a
            href="/api/cognito/login?screen_hint=signup"
            className="block w-[60%] mx-auto px-8 py-2 rounded-lg text-white font-semibold text-center"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Registro
          </a>
          <a
            href="/api/cognito/login"
            className="block w-[60%] mx-auto px-8 py-2 rounded-lg text-center font-semibold border"
            style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
          >
            Inicio de sesión
          </a>
        </div>
      </Card>
      </div>
    </div>
  )
}
