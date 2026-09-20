//next
import Link from "next/link";
//fontawesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faNotesMedical, faRulerVertical, faCreditCard, faClipboardCheck } from '@fortawesome/free-solid-svg-icons'
//shared
import {Card, SubsectionHead, SubsectionTitle} from '@/shared'
import { getSession } from '@/shared/auth/session'
import { syncProfileAction } from '@/shared/auth/profile.actions'

const steps = [
  { title: 'Información personal:', text: 'Completa tus datos básicos.', icon: faUser },
  { title: 'Chat con Nuvi:', text: 'Conversa con Nuvi para que pueda conocer tus objetivos deportivos y requerimientos.', icon: faNotesMedical },
  { title: 'Datos físicos:', text: 'Ingresa tu información física, como peso y talla.', icon: faRulerVertical },
  { title: 'Pago seguro:', text: 'Realiza el pago de US$5 para generar tu plan.', icon: faCreditCard },
  { title: '¡Tu plan está listo!', text: 'Descárgalo tu plan y recíbelo también por correo electrónico.', icon: faClipboardCheck },
]

export default async function StartConsultation() {
  const { isAuthenticated } = await getSession()

  let href = '/login'
  if (isAuthenticated) {
    const result = await syncProfileAction()
    // Si falla la sincronización (token inválido, backend caído), se cae a informacion-personal
    // por seguridad — nunca a anamnesis sin confirmar que el perfil está completo.
    href = result.ok && result.data.profileComplete
      ? '/panel'
      : '/consulta/informacion-personal'
  }

  return (
    <div className="w-full py-4">
      <div className="max-w-2xl flex flex-col mx-auto" >
      <Card widthInner='90%'>
        <SubsectionHead>
          <SubsectionTitle mb={2} title="Antes de iniciar"/>
          <p className="text-zinc-900 text-md">
            Considera que la consulta cuenta con los siguientes pasos:
          </p>
        </SubsectionHead>

          <div className="flex flex-col gap-3 mb-6">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex items-center gap-4 rounded-lg px-4 py-2 border bg-white/30 backdrop-blur-md border-white/40"
              >
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <FontAwesomeIcon icon={step.icon} style={{ color: 'white', width: '18px', height: '18px' }} />
                </div>
                <p className="font-medium text-md text-left text-zinc-900" style={{textAlign: 'justify'}}>
                  <span className="font-semibold me-2">{step.title}</span>
                  {step.text}
                </p>
              </div>
            ))}
          </div>

          <Link
            href={href}
            className="block w-[60%] mx-auto px-8 py-2 rounded-lg text-white font-semibold text-center"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Iniciar
          </Link>
      </Card>
      </div>
    </div>
  )
}
