//next
import Link from "next/link";
//fontawesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faNotesMedical, faRulerVertical, faCreditCard, faClipboardCheck } from '@fortawesome/free-solid-svg-icons'
//shared
import {Card, HeadSubSec, TitleSubSec} from '@/shared'

// const pasos = [
//   { titulo: 'Información personal:', texto: 'Comienza completando tus datos personales básicos. Esta información permitirá personalizar tu evaluación nutricional.', icon: faUser },
//   { titulo: 'Conversación con Nuvi:', texto: 'Nuvi conversará contigo para conocer tus objetivos, hábitos alimentarios y de estilo de vida, además de información sobre los deportes que practicas. Responde con la mayor claridad y detalle posible para obtener un plan más preciso.', icon: faNotesMedical },
//   { titulo: 'Datos físicos:', texto: 'Ingresa tu información física, como peso y talla. Estos datos serán utilizados para elaborar tu plan con mayor precisión.', icon: faRulerVertical },
//   { titulo: 'Pago seguro:', texto: 'Una vez finalizada la evaluación, deberás realizar un pago de US $5 para obtener tu plan nutricional personalizado.', icon: faCreditCard },
//   { titulo: '¡Tu plan está listo!', texto: 'Tras confirmar el pago, podrás descargar tu plan nutricional de inmediato. Además, recibirás una copia en tu correo electrónico.', icon: faClipboardCheck },
// ]

const pasos = [
  { titulo: 'Información personal:', texto: 'Completa tus datos básicos.', icon: faUser },
  { titulo: 'Chat con Nuvi:', texto: 'Conversa con Nuvi para que pueda conocer tus objetivos deportivos y requerimientos.', icon: faNotesMedical },
  { titulo: 'Datos físicos:', texto: 'Ingresa tu información física, como peso y talla.', icon: faRulerVertical },
  { titulo: 'Pago seguro:', texto: 'Realiza el pago de US$5 para generar tu plan.', icon: faCreditCard },
  { titulo: '¡Tu plan está listo!', texto: 'Descárgalo tu plan y recíbelo también por correo electrónico.', icon: faClipboardCheck },
]

export default function IniciarConsulta() {
  return (
    <div className="w-full min-h-screen py-24">
      <div className="max-w-2xl flex flex-col mx-auto" >
      <Card widthInner='90%'>
        <HeadSubSec>
          <TitleSubSec mb={2} title="Antes de iniciar"/>
          <p className="text-zinc-900 text-md">
            Considera que la consulta cuenta con los siguientes pasos:
          </p>
        </HeadSubSec>

          <div className="flex flex-col gap-3 mb-6">
            {pasos.map((paso, index) => (
              <div
                key={index}
                className="flex items-center gap-4 rounded-lg px-4 py-2 border bg-white/30 backdrop-blur-md border-white/40"
              >
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <FontAwesomeIcon icon={paso.icon} style={{ color: 'white', width: '18px', height: '18px' }} />
                </div>
                <p className="font-medium text-md text-left text-zinc-900" style={{textAlign: 'justify'}}>
                  <span className="font-semibold me-2">{paso.titulo}</span>
                  {paso.texto}
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
