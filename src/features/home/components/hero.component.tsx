//NEXT
import Link from "next/link";
import Image from "next/image";
//FONTAWESOME
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserDoctor, faClipboardList, faCapsules, faDumbbell } from '@fortawesome/free-solid-svg-icons'
//FEATURES
import { NuviViewGreen } from "./nuvi-view-green.component";
import { NuviViewTeal } from "./nuvi-view-teal.component";

const features = [
  { text: 'Agente de IA especializado en nutrición', description: 'Entrenado por expertos en nutrición deportiva', icon: faUserDoctor },
  { text: 'Planes personalizados', description: 'Adaptados a tus objetivos, tu deporte y tu estilo de vida.', icon: faClipboardList },
  { text: 'Suplementación', description: 'Recomendaciones seguras y ajustadas a tus necesidades.', icon: faCapsules },
  { text: 'Estrategias deportivas', description: 'Mejora el rendimiento en entrenamientos y competencias.', icon: faDumbbell },
]

// startHref viene como prop (no se calcula acá con getStartConsultationHref()) porque este
// componente se re-exporta desde el barrel @/features junto a Client Components (ej.
// testimonial-form.component.tsx) — eso arrastra este archivo al bundle del navegador, donde no
// puede importar nada de src/shared/auth/session.ts (server-only). Se calcula en el Server
// Component que sí es inequívocamente servidor (src/app/page.tsx) y se pasa ya resuelto.
export function Hero({ startHref }: { startHref: string }) {
  return (
    <div className="relative w-full h-screen flex flex-row items-center px-6">
      <Image
        src="/images/img-background-city.jpeg"
        alt=""
        fill
        priority
        className="object-cover -z-20"
      />
      {/* forma blanca del lado izquierdo: solo desde md */}
      <div className="hidden md:block absolute inset-y-0 left-0 h-full w-[50%] -z-10" >
        <Image
          src="/images/img-1-back.png"
          alt=""
          fill
          priority
        />
      </div>
      {/* velo blanco sobre la foto: algo más opaco en móvil, donde no está la forma blanca detrás del texto */}
      <div className="absolute inset-0 bg-white/40 md:bg-white/20 -z-10" />

      <div className="relative w-full md:w-1/2 h-full flex flex-col items-center justify-center text-center" >
        <div className="w-full md:w-[80%] lg:w-[80%] xl:w-[80%] flex flex-col items-start mt-0 md:mt-8" 
        >
          {/* title */}
          <h2 className="w-full text-5xl text-left mb-10" style={{fontWeight: 600 }} >
            <span className="text-zinc-800">Nutrición </span> <br/>
            <span style={{ color: 'var(--color-primary)' }}>personalizada</span>
          </h2>
          {/* features */}
          <div className="w-full md:w-[70%] flex flex-col gap-3 mb-6" >
            {features.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-4 rounded-lg border-l-2 px-4 py-3 bg-white/80 backdrop-blur-sm"
                style={{ borderLeftColor: 'var(--color-primary)' }}>
                {/* icon */}
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-full shrink-0"
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
            href={startHref}
            className="relative text-md block w-full md:w-[70%] px-6 py-2 rounded-lg text-white mb-1 shadow-lg text-center"
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

      {/* círculo con el rostro: solo desde md */}
      <div className="relative hidden md:flex w-1/2 h-full items-center justify-center">
        <NuviViewTeal />
      </div>
    </div>
  )
}
