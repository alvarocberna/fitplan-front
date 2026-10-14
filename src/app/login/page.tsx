//shared
import {Card, SubsectionHead, SubsectionTitle, LoginOptions} from '@/shared'
import { sanitizeReturnTo } from '@/shared/auth/return-to'

const ERROR_MESSAGES: Record<string, string> = {
  callback_failed: 'No pudimos completar tu inicio de sesión. Intenta de nuevo.',
  email_not_verified: 'Debes verificar tu correo electrónico antes de continuar. Revisa tu bandeja de entrada e inicia sesión de nuevo.',
  session_expired: 'Tu sesión expiró. Inicia sesión nuevamente para continuar.',
  login_unavailable: 'El inicio de sesión no está disponible en este momento. Intenta de nuevo en unos minutos.',
}

export default async function ConsultaLogin({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { error, return_to } = await searchParams
  const errorMessage = typeof error === 'string' ? ERROR_MESSAGES[error] : undefined
  // intención con la que se llegó (p. ej. /consulta/inicio desde "Iniciar Consulta"); se reenvía a las
  // opciones de login para que el callback la respete. Sin ella, el login es "solo entrar".
  const returnTo = typeof return_to === 'string' ? sanitizeReturnTo(return_to) ?? undefined : undefined

  return (
    <div className="w-full min-h-screen py-24">
      <div className="max-w-2xl flex flex-col mx-auto" >
      <Card widthInner='90%'>
        <SubsectionHead>
          <SubsectionTitle mb={2} title="Inicia sesión para continuar"/>
        </SubsectionHead>

        {errorMessage && (
          <p role="alert" className="text-red-400 text-sm text-center mb-4">
            {errorMessage}
          </p>
        )}

        <LoginOptions returnTo={returnTo} />
      </Card>
      </div>
    </div>
  )
}
