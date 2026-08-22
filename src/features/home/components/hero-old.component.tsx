//NEXT
import Link from "next/link";
import Image from "next/image";

export function HeroOld() {
  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center text-center px-6">
      {/* <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/20"/> */}

      <div className="relative w-full md:w-[80%] lg:w-[60%] xl:w-[40%] flex flex-col items-center">
        {/* face */}
        {/* <div className="relative w-full flex mb-3">
          <Image src='/icons/face.png' className="m-auto" alt="face" width={280} height={280} />
        </div> */}
        {/* title */}
        <h2 className="text-5xl text-zinc-900 mb-5">
          NUVI
        </h2>
        {/* text 1*/}
        <p className="relative w-full text-zinc-700 text-md md:text-md mb-6 text-justify">
          <b>Nutricionista Virtual</b> entrenado por expertos en nutrición deportiva y potenciado por IA.
          Inicia una consulta para obtener un plan nutricional personalizado o también obtén un
          plan pre elaborado por deporte y objetivo.
        </p>
        {/* button 1*/}
        <Link
          href="/consultation/start"
          className="relative block w-[60%] px-6 py-2 rounded-lg text-white mb-1 shadow-lg"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          Iniciar Consulta
        </Link>
        {/* button 2 */}
        <Link
          href="/#nuvi-saber-mas"
          className="relative block w-[60%] px-6 py-2 text-zinc-600">
          Saber Más
        </Link>
      </div>
      
    </div>
  )
}
