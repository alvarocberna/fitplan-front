//next
import Link from "next/link";
//shared
import {Card} from '@/shared'

export function IniciarConsulta() {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center text-center px-6 py-24">
      <div className="max-w-2xl flex flex-col" >
      <Card>
        <div className="py-12 px-6" >
          <p className="text-xl md:text-2xl font-semibold text-gray-900">
            Nutri Noa es un nutricionista virtual entrenado por nutricionistas expertos y potenciado por inteligencia artificial
          </p>
          <p className="text-base md:text-lg text-gray-700">
            La consulta consiste en una recopilación de información relevante en el aspecto de salud y nutricional, historial clínico, habitos alimenticios, deporte prácticado y objetivo que deseas alcanzar.
          </p>
          <p className="text-base md:text-lg text-gray-700 mb-10">
            Posterior a la consulta, Noa generará un plan nutricional personalizado para ti, el cual llegará a tu correo y podrás descargar después de realizar el pago de este de 5$.
          </p>

          <Link
            href="/consulta/informacion-personal"
            className="mt-4 mx-auto px-8 py-3 rounded-lg text-white font-semibold bg-green-500"
            // style={{ backgroundColor: '#4ed591' }}
          >
            Iniciar
          </Link>
        </div>
        </Card>
      </div>
    </div>
  )
}
