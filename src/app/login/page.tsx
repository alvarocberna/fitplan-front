//shared
import {Card, SubsectionHead, SubsectionTitle, LoginOptions} from '@/shared'

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
          <SubsectionTitle mb={2} title="Inicia sesión para continuar"/>
        </SubsectionHead>

        {errorMessage && (
          <p role="alert" className="text-red-400 text-sm text-center mb-4">
            {errorMessage}
          </p>
        )}

        <LoginOptions />
      </Card>
      </div>
    </div>
  )
}
