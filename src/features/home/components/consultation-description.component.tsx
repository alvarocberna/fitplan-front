//next
import Link from 'next/link';
//fontawesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faNotesMedical, faRulerVertical, faCreditCard, faClipboardCheck } from '@fortawesome/free-solid-svg-icons'
//shared
import {Card, SubsectionHead, SubsectionTitle} from '@/shared';

const steps = [
  {
    step: '01',
    title: 'Registro',
    text: 'Inicia sesión o registrate para iniciar tu consulta.',
    icon: faUser
  },
  {
    step: '02',
    title: 'Conversa con Nuvi',
    text: 'Nuvi es un modelo de IA inteligente con el que puedes conversar sobre el deporte que practicas, tus objetivos, hábitos alimentarios y estrategias deportivas. Toda esta información Nuvi la utilizará para conocerte mejor e idear tu plan.',
    icon: faNotesMedical
  },
  {
    step: '03',
    title: 'Datos físicos',
    text: 'Ingresa información física básica, como peso, talla y forma corporal. Estos datos serán utilizados para elaborar tu plan nutricional  con mayor precisión.',
    icon: faRulerVertical
  },
  {
    step: '04',
    title: 'Pago seguro con Webpay',
    text: 'Al finalizar la consulta, serás redirigido a webpay para realizar el pago de tu plan (5.000 clp).',
    icon: faCreditCard
  },
  {
    step: '05',
    title: '¡Tu plan está listo!',
    text: 'Tu plan será enviado a tu correo y quedará guardado en tu perfil para que lo descargues en cualquier momento.',
    icon: faClipboardCheck
  },
]

export function ConsultationDescription() {
  return (
    <div id="consulta-nutricional-virtual" className="w-full min-h-screen flex flex-col items-center justify-center text-center px-6">
      {/* inner container */}
      <div className="w-[90%] md:w-[80%] mx-auto flex flex-col">
        {/* title */}
        <h2 className="text-2xl md:text-4xl w-full font-bold text-zinc-800 mb-2">
          Consulta Nutricional
        </h2>
        {/* description */}
        <p className="text-xl md:text-2xl w-full font-bold text-zinc-800 mb-6">
          ¿En qué consiste?
        </p>
        {/* cards */}
        <div className="w-full flex flex-col mx-auto" >
            <div className="flex flex-wrap justify-center gap-10">
              {steps.map((paso, index) => (
                <div
                  key={index}
                  className="relative overflow-hidden flex flex-col w-[30%] items-start gap-4 rounded-xl px-6 py-6 bg-white/30 backdrop-blur-md border border-white/60 shadow-lg shadow-black/5 transition-colors hover:bg-white/40"
                >
                  {/* top border accent */}
                  <span
                    className="absolute top-0 left-0 w-full h-1.5"
                    style={{
                      background: 'linear-gradient(90deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 30%, white))',
                    }}
                  />
                  {/* number and title */}
                  <div className="flex items-center gap-3 w-full">
                    <span
                      className="flex items-center justify-center w-10 h-10 rounded-full text-lg font-bold shrink-0"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, white)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      {paso.step}
                    </span>
                    {/* title */}
                    <p className='font-semibold text-lg text-left text-zinc-800'>
                      {paso.title}
                    </p>
                  </div>
                  {/* description */}
                  <p className=" text-md text-left text-zinc-800" style={{textAlign: 'justify'}}>
                    {paso.text}
                  </p>
                </div>
              ))}
            </div>
        </div>
      </div>

    </div>
  )
}
