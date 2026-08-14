
//FONTAWESOME
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCheck } from "@fortawesome/free-solid-svg-icons"
import { IconDefinition } from "@fortawesome/fontawesome-svg-core"
import { Pauta } from './pauta.component';


const caracteristicas: { icon: IconDefinition; title: string; description: string }[] = [
{
  icon: faCheck,
  title: "Macronutrientes personalizados",
  description: "Obtén un plan nutricional personalizado según tu objetivo, ya sea bajar de peso, aumentar masa muscular o potenciar tu rendimiento deportivo en deportes como futbol, rugby, hockey, remo, atletismo, maratón, entre otros.",
},
{
  icon: faCheck,
  title: "Suplementación",
  description: "Prescripción de suplementos respaldados por evidencia científica de alta calidad, priorizando su seguridad y efectividad.",
},
{
  icon: faCheck,
  title: "Estrategias deportivas",
  description: "Planificación de estrategias nutricionales adaptadas a tus entrenamientos y competencias, incluyendo timing nutricional y reposición de energía e hidratación.",
},
]

export function PlanPersonalDescripcion() {
  return (
    <div id="plan-personal" className="w-full min-h-screen flex flex-col items-center justify-center text-center px-6 mb-20">
      {/* inner container */}
      <div className="w-[90%] md:w-[80%] mx-auto">
        {/* title */}
        <h2 className="w-[90%] md:w-[80%] mx-auto text-center text-2xl md:text-4xl font-bold text-zinc-800 mb-20">
          Plan nutricional personalizado
        </h2>
        <div className="flex flex-col md:flex-row justify-between">
          {/* right */}
          <div className="w-full md:w-[50%]">
            {caracteristicas.map((caracteristica, index) => (
              <div key={index} className="flex items-start mb-6">
                <div className="w-18 h-18 shrink-0 flex rounded-md me-5" style={{border: '1px solid var(--color-primary)'}}>
                  <FontAwesomeIcon icon={caracteristica.icon} className="m-auto" style={{width: '30px', height: '30px', color: 'var(--color-primary)'}} />
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
          {/* left */}
          <div className="w-full md:w-[40%] flex flex-col justify-start">
            <Pauta/>
          </div>
        </div>
      </div>
    </div>
  )
}
