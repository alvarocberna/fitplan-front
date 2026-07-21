
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faFutbol } from "@fortawesome/free-solid-svg-icons"
import { IconDefinition } from "@fortawesome/fontawesome-svg-core"
import { Font } from "@react-pdf/renderer"

const deportes: { label: string; icon: IconDefinition }[] = [
  { label: "futbol", icon: faFutbol },
  { label: "futbol", icon: faFutbol },
  { label: "futbol", icon: faFutbol },
  { label: "futbol", icon: faFutbol },
  { label: "futbol", icon: faFutbol },
  { label: "futbol", icon: faFutbol },
  { label: "futbol", icon: faFutbol },
]

export function NuviDescripcion() {
  return (
    <div id="que-es-nuvi" className="w-full min-h-screen flex flex-col items-center justify-center text-center px-6 mb-20">
      <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">
        Nuvi
      </h2>
      <h2 className="text-xl md:text-2xl font-bold text-white mb-6">
        ¿Igual a un nutricionista?
      </h2>

      {/* Divs */}
      <div className="w-2xl">
        {/* div 1 */}
        <div className="flex flex-col rounded-lg px-4 py-4 border bg-white/30 backdrop-blur-md border-white/40 mb-3">
          <p className="font-semibold text-lg text-left text-zinc-900">
            Entrenamiento
          </p>
          <p className="font-medium text-md  text-zinc-900" style={{textAlign: 'justify'}}>
            Nuvi es un modelo de IA experto en nutrición, el cual ha sido entrenado por nutricionistas especialistas
            en el area deportiva. Nuvi tiene la capacidad de analizar datos y generar prexcripciones siguiendo los
            mismos criterios que usarían profesionales expertos.
          </p>
        </div>
        {/* div 2 */}
        <div className="flex flex-col rounded-lg px-4 py-4 border bg-white/30 backdrop-blur-md border-white/40 mb-3">
          <p className="font-semibold text-lg text-left text-zinc-900">
            Planificación
          </p>
          <p className="font-medium text-md  text-zinc-900" style={{textAlign: 'justify'}}>
            Capacidad de planificar igual a un nutricionista.
          </p>
        </div>
        {/* div 3 */}
        <div className="flex flex-col rounded-lg px-4 py-4 border bg-white/30 backdrop-blur-md border-white/40 mb-3">
          <p className="font-semibold text-lg text-left text-zinc-900">
            Suplementación
          </p>
          <p className="font-medium text-md  text-zinc-900" style={{textAlign: 'justify'}}>
            Entrenaod en suplementos
          </p>
        </div>
        {/* div 4 */}
        <div className="flex flex-col rounded-lg px-4 py-4 border bg-white/30 backdrop-blur-md border-white/40 mb-3">
          <p className="font-semibold text-lg text-left text-zinc-900">
            Estrategias deportivas
          </p>
          <p className="font-medium text-md  text-zinc-900" style={{textAlign: 'justify'}}>
            Capacidad de analizar y elaborar estrategias deportivas para los entrenamientos y competencias
          </p>
        </div>
        {/* div 5 */}
        <div className="flex flex-col rounded-lg px-4 py-4 border bg-white/30 backdrop-blur-md border-white/40 mb-3">
          <p className="font-semibold text-lg text-left text-zinc-900">
            Aplicable a muchos deportes
          </p>
          <p className="font-medium text-md text-zinc-900 mb-4" style={{textAlign: 'justify'}}>
            Nuvi es capaz de atender varias disciplinas deportivas: insertar imagenes d edeportes aquí abajo
          </p>
          <div className="flex flex-wrap justify-between">
            {deportes.map((deporte) => (
              <span key={deporte.label} className="flex flex-col w-[15%] px-2 py-2 mb-3 border border-gray-100 rounded-lg">
                <p className="text-sm text-gray-100 mb-1">{deporte.label}</p>
                <FontAwesomeIcon icon={deporte.icon} className="text-gray-100 m-auto" style={{ width: '30px', height: '30px' }}/>
              </span>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
