//next
import Link from "next/link";
//FONTAWESOME
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faNotesMedical, faRulerVertical, faCreditCard } from '@fortawesome/free-solid-svg-icons'

const steps = [
  { href: '#que-es-fitplan', text: 'Fitplan ¿igual a un nutricionista?', icon: faUser },
  { href: '#consulta-nutricional-virtual', text: 'Consulta nutricional virtual ¿en qué consiste?', icon: faNotesMedical },
  { href: '#plan-nutricional-personalizado', text: 'Plan nutricional personalizado ¿qué incluye?', icon: faRulerVertical },
  { href: '#plan-estandarizado-por-disciplina', text: 'Planes estandarizados por deportes y objetivos', icon: faCreditCard },
]

export function LearnMore() {
  return (
    <div id="saber-mas" className="w-full h-screen flex flex-col items-center justify-center text-center px-6">
      <h2 className="text-2xl md:text-4xl font-bold text-zinc-800 mb-8">
        Saber más
      </h2>
      <div className="w-2xl flex flex-col gap-3 mb-6">
        {steps.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className="flex items-center gap-4 rounded-lg px-4 py-2 border bg-white/30 backdrop-blur-md border-zinc-200 shadow-lg"
          >
            <div
              className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <FontAwesomeIcon icon={item.icon} style={{ color: 'white', width: '18px', height: '18px' }} />
            </div>
            <p className="font-medium text-md text-left text-zinc-800" style={{textAlign: 'justify'}}>
              {item.text}
            </p>
          </Link>
        ))}
      </div>

    </div>
  )
}
