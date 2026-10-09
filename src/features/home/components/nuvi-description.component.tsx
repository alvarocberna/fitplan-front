//NEXT
import Link from "next/link"
//FONTAWESOME
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowRight, faPills, } from "@fortawesome/free-solid-svg-icons"
import { faClipboard, faClock } from "@fortawesome/free-regular-svg-icons"
import { IconDefinition } from "@fortawesome/fontawesome-svg-core"


const features: { icon: IconDefinition; title: string; description: string }[] = [
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

// Botón "Comenzar". Se renderiza dos veces porque cambia de lugar según el ancho (bajo el texto en
// escritorio, bajo las características en móvil); `className` decide en cuál se ve.
function StartLink({ className }: { className: string }) {
  return (
    <Link
      href="/consulta/inicio"
      className={`px-6 py-2 rounded-lg items-center text-white shadow-lg ${className}`}
      style={{ backgroundColor: 'var(--color-primary)' }}
    >
      Comenzar
      <FontAwesomeIcon icon={faArrowRight} className="color-white ms-4" style={{width: '18px', height: '18px'}} />
    </Link>
  )
}

export function NuviDescription() {
  return (
    <div id="fitplan-saber-mas" className="w-full min-h-screen pt-[50px] md:pt-0 flex items-center justify-center text-center px-6 mb-20">
      {/* inner container */}
      <div className="w-[90%] md:w-[80%] mx-auto flex flex-col md:flex-row justify-between">
        {/* left */}
        <div className="w-full md:w-[40%] flex flex-col justify-start">
          <h2 className="text-left text-2xl md:text-4xl font-bold text-zinc-800 mb-8">
            Guía tu alimentación con un experto
          </h2>
          <p className="font-medium text-md mb-8 text-zinc-800" style={{textAlign: 'justify'}}>
            Fitplan es un modelo de IA experto en nutrición, el cual ha sido entrenado por nutricionistas con solida experiencia
            trabajando con deportistas de alto rendimiento. Fitplan cuenta con un modelo inteligente con la capacidad de analizar 
            datos, razonar y planificar pautas nutricionales específicas para cada disciplina deportiva y objetivo. 
          </p>
          {/* escritorio: el botón va bajo el texto. En móvil se muestra el de más abajo, tras las características */}
          <StartLink className="hidden md:flex self-start w-fit" />
        </div>
        {/* right */}
        <div className="w-full md:w-[50%]">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start mb-6">
              <div className="w-13.5 h-13.5 md:w-18 md:h-18 shrink-0 flex rounded-md me-5" style={{border: '1px solid var(--color-primary)'}}>
                <FontAwesomeIcon icon={feature.icon} className="m-auto w-7.5! h-7.5! md:w-10! md:h-10!" style={{color: 'var(--color-primary)'}} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-lg text-left text-zinc-800 mb-1">
                  {feature.title}
                </p>
                <p className="font-medium text-sm text-zinc-800" style={{textAlign: 'justify'}}>
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
          {/* móvil: el botón va debajo de las características */}
          <StartLink className="flex md:hidden w-full justify-center mb-5" />
        </div>
      </div>
    </div>
  )
}
