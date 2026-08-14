//NEXT
import Link from "next/link"
//FONTAWESOME
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowRight, faPills, } from "@fortawesome/free-solid-svg-icons"
import { faClipboard, faClock } from "@fortawesome/free-regular-svg-icons"
import { IconDefinition } from "@fortawesome/fontawesome-svg-core"


const caracteristicas: { icon: IconDefinition; title: string; description: string }[] = [
{
  icon: faClipboard,
  title: "Planes especializados",
  description: "Obtén un plan nutricional personalizado según tu objetivo, ya sea bajar de peso, aumentar masa muscular o potenciar tu rendimiento deportivo en deportes como futbol, rugby, hockey, remo, atletismo, maratón, entre otros.",
},
{
  icon: faPills,
  title: "Suplementación",
  description: "Prescripción de suplementos respaldados por evidencia científica de alta calidad, priorizando su seguridad y efectividad.",
},
{
  icon: faClock,
  title: "Estrategias deportivas",
  description: "Planificación de estrategias nutricionales adaptadas a tus entrenamientos y competencias, incluyendo timing nutricional y reposición de energía e hidratación.",
},
]

export function NuviDescripcion() {
  return (
    <div id="nuvi-saber-mas" className="w-full min-h-screen flex items-center justify-center text-center px-6 mb-20">
      {/* inner container */}
      <div className="w-[90%] md:w-[80%] mx-auto flex flex-col md:flex-row justify-between">
        {/* left */}
        <div className="w-full md:w-[40%] flex flex-col justify-start">
          <h2 className="text-left text-2xl md:text-4xl font-bold text-zinc-800 mb-8">
            Guía tu alimentación con un experto
          </h2>
          <p className="font-medium text-md mb-8 text-zinc-800" style={{textAlign: 'justify'}}>
            Nuvi es un modelo de IA experto en nutrición, el cual ha sido entrenado por nutricionistas con solida experiencia
            trabajando con deportistas de alto rendimiento. Nuvi cuenta con un modelo inteligente con la capacidad de analizar 
            datos, razonar y planificar pautas nutricionales específicas para cada disciplina deportiva y objetivo. 
          </p>
          <Link
            href="/consulta/iniciar-consulta"
            className="self-start px-6 py-2 rounded-lg flex items-center text-white shadow-lg"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Comenzar
            <FontAwesomeIcon icon={faArrowRight} className="color-white ms-4" style={{width: '18px', height: '18px'}} />
          </Link>
        </div>
        {/* right */}
        <div className="w-full md:w-[50%]">
          {caracteristicas.map((caracteristica, index) => (
            <div key={index} className="flex items-start mb-6">
              <div className="w-18 h-18 shrink-0 flex rounded-md me-5" style={{border: '1px solid var(--color-primary)'}}>
                <FontAwesomeIcon icon={caracteristica.icon} className="m-auto" style={{width: '40px', height: '40px', color: 'var(--color-primary)'}} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-lg text-left text-zinc-800 mb-1">
                  {caracteristica.title}
                </p>
                <p className="font-medium text-sm text-zinc-800" style={{textAlign: 'justify'}}>
                  {caracteristica.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
