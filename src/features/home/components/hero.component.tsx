//NEXT
import Link from "next/link";
import Image from "next/image";
//FONTAWESOME
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserDoctor, faClipboardList, faCapsules, faDumbbell } from '@fortawesome/free-solid-svg-icons'
//FEATURES
import { NuviView } from "./nuvi-view.component";

const features = [
  { text: 'Nutricionista virtual', description: 'Entrenado por expertos en nutrición deportiva', icon: faUserDoctor },
  { text: 'Planes personalizados', description: 'Adaptados a tus objetivos, tu deporte y tu estilo de vida.', icon: faClipboardList },
  { text: 'Suplementación', description: 'Recomendaciones seguras y ajustadas a tus necesidades.', icon: faCapsules },
  { text: 'Estrategias deportivas', description: 'Mejora el rendimiento en entrenamientos y competencias.', icon: faDumbbell },
]

export function Hero() {
  return (
    <div className="relative w-full h-screen flex flex-row items-center px-6">
      <Image
        src="/images/img-background-city.jpeg"
        alt=""
        fill
        priority
        className="object-cover -z-20"
      />
      <div className="absolute inset-y-0 left-0 h-full w-[50%] -z-10" >
        <Image
          src="/images/img-1-back.png"
          alt=""
          fill
          priority
        />
      </div>
      <div className="absolute inset-0 bg-white/20 -z-10" />

      <div className="relative w-1/2 h-full flex flex-col items-center justify-center text-center" >
        <div className="w-full md:w-[80%] lg:w-[80%] xl:w-[80%] flex flex-col items-start"
        >
          {/* title */}
          <h2 className="w-full text-5xl text-left mb-10" style={{fontWeight: 600 }} >
            <span className="text-zinc-800">Alcanza tu mejor </span> <br/>
            <span style={{ color: 'var(--color-primary)' }}>versión, cada día</span>
          </h2>
          {/* features */}
          <div className="w-full md:w-[70%] flex flex-col gap-3 mb-6">
            {features.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-4 rounded-lg px-4 py-2 bg-white/70 ">
                {/* icon */}
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-full shrink-0"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <FontAwesomeIcon icon={item.icon} style={{ color: 'white', width: '16px', height: '16px' }} />
                </div>
                {/* texto */}
                <div className="text-left" style={{ textAlign: 'justify' }}>
                  <p className="font-medium text-sm text-zinc-800">
                    {item.text}
                  </p>
                  <p className="text-xs text-zinc-600">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {/* button 1*/}
          <Link
            href="/consulta/inicio"
            className="relative text-sm block w-full md:w-[70%] px-6 py-2 rounded-lg text-white mb-1 shadow-lg text-center"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Iniciar Consulta
          </Link>
          {/* button 2 */}
          <Link
            href="/#nuvi-saber-mas"
            className="relative block w-full md:w-[70%] px-6 py-2 text-sm text-zinc-600">
            Saber Más
          </Link>
        </div>
      </div>

      <div className="relative w-1/2 h-full flex items-center justify-center">
        <NuviView />
      </div>
    </div>
  )
}
