//next
import Link from 'next/link';
//fontawesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faNotesMedical, faRulerVertical, faCreditCard, faClipboardCheck } from '@fortawesome/free-solid-svg-icons'
//shared
import {Card, HeadSubSec, TitleSubSec} from '@/shared';

const pasos = [
  { 
    step: '01',
    titulo: 'Información personal', 
    texto: 'Comienza completando tus datos personales básicos. Esta información permitirá personalizar tu evaluación nutricional.', 
    icon: faUser 
  },
  { 
    step: '02',
    titulo: 'Conversación con Nuvi', 
    texto: 'Nuvi conversará contigo para conocer tus objetivos, hábitos alimentarios y de estilo de vida, además de información sobre los deportes que practicas. Responde con la mayor claridad y detalle posible para obtener un plan más preciso.', 
    icon: faNotesMedical 
  },
  { 
    step: '03',
    titulo: 'Datos físicos', 
    texto: 'Ingresa tu información física, como peso y talla. Estos datos serán utilizados para elaborar tu plan con mayor precisión.', 
    icon: faRulerVertical 
  },
  { 
    step: '04',
    titulo: 'Pago seguro', 
    texto: 'Una vez finalizada la evaluación, deberás realizar un pago de US $5 para obtener tu plan nutricional personalizado.', 
    icon: faCreditCard 
  },
  { 
    step: '05',
    titulo: '¡Tu plan está listo!', 
    texto: 'Tras confirmar el pago, podrás descargar tu plan nutricional de inmediato. Además, recibirás una copia en tu correo electrónico.', 
    icon: faClipboardCheck 
  },
]

export function ConsultaDescripcion() {
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
              {pasos.map((paso, index) => (
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
                    {paso.titulo}
                  </p>
                  {/* description */}
                  <p className="font-medium text-md text-left text-zinc-900" style={{textAlign: 'justify'}}>
                    {paso.texto}
                  </p>
                </div>
              ))}
            </div>
        </div>
      </div>

    </div>
  )
}
