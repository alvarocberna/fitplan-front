//next
import Link from "next/link";
//fontawesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faNotesMedical, faRulerVertical, faCreditCard, faClipboardCheck } from '@fortawesome/free-solid-svg-icons'
//shared
import {Card, SubsectionHead, SubsectionTitle} from '@/shared'

// const steps = [
//   { title: 'Información personal:', text: 'Comienza completando tus datos personales básicos. Esta información permitirá personalizar tu evaluación nutricional.', icon: faUser },
//   { title: 'Conversación con Nuvi:', text: 'Nuvi conversará contigo para conocer tus objetivos, hábitos alimentarios y de estilo de vida, además de información sobre los deportes que practicas. Responde con la mayor claridad y detalle posible para obtener un plan más preciso.', icon: faNotesMedical },
//   { title: 'Datos físicos:', text: 'Ingresa tu información física, como peso y talla. Estos datos serán utilizados para elaborar tu plan con mayor precisión.', icon: faRulerVertical },
//   { title: 'Pago seguro:', text: 'Una vez finalizada la evaluación, deberás realizar un pago de US $5 para obtener tu plan nutricional personalizado.', icon: faCreditCard },
//   { title: '¡Tu plan está listo!', text: 'Tras confirmar el pago, podrás descargar tu plan nutricional de inmediato. Además, recibirás una copia en tu correo electrónico.', icon: faClipboardCheck },
// ]

const steps = [
  { title: 'Información personal:', text: 'Completa tus datos básicos.', icon: faUser },
  { title: 'Chat con Nuvi:', text: 'Conversa con Nuvi para que pueda conocer tus objetivos deportivos y requerimientos.', icon: faNotesMedical },
  { title: 'Datos físicos:', text: 'Ingresa tu información física, como peso y talla.', icon: faRulerVertical },
  { title: 'Pago seguro:', text: 'Realiza el pago de US$5 para generar tu plan.', icon: faCreditCard },
  { title: '¡Tu plan está listo!', text: 'Descárgalo tu plan y recíbelo también por correo electrónico.', icon: faClipboardCheck },
]

export default function StartConsultation() {
  return (
    <div className="w-full min-h-screen py-24">
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
            href="/consulta/informacion-personal"
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
