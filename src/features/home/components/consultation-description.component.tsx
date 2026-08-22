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
    title: 'Información personal',
    text: 'Comienza completando tus datos personales básicos. Esta información permitirá personalizar tu evaluación nutricional.',
    icon: faUser
  },
  {
    step: '02',
    title: 'Conversación con Nuvi',
    text: 'Nuvi conversará contigo para conocer tus objetivos, hábitos alimentarios y de estilo de vida, además de información sobre los deportes que practicas. Responde con la mayor claridad y detalle posible para obtener un plan más preciso.',
    icon: faNotesMedical
  },
  {
    step: '03',
    title: 'Datos físicos',
    text: 'Ingresa tu información física, como peso y talla. Estos datos serán utilizados para elaborar tu plan con mayor precisión.',
    icon: faRulerVertical
  },
  {
    step: '04',
    title: 'Pago seguro',
    text: 'Una vez finalizada la evaluación, deberás realizar un pago de US $5 para obtener tu plan nutricional personalizado.',
    icon: faCreditCard
  },
  {
    step: '05',
    title: '¡Tu plan está listo!',
    text: 'Tras confirmar el pago, podrás descargar tu plan nutricional de inmediato. Además, recibirás una copia en tu correo electrónico.',
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
                  className="flex flex-col w-[30%] items-center gap-4 rounded-lg px-4 py-2" 
                >
                  {/* number and icon */}
                  <p className='text-3xl text-center' style={{color: 'var(--color-primary)'}}>
                    {paso.step}
                  </p>
                  {/* title */}
                  <p className='font-semibold text-md text-center text-zinc-800'>
                    {paso.title}
                  </p>
                  {/* description */}
                  <p className="font-medium text-md text-left text-zinc-900" style={{textAlign: 'justify'}}>
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
