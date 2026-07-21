//NEXT
import Link from "next/link";
import Image from "next/image";

export function Portada() {
  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center text-center px-6">
      {/* <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/20"/> */}

      <div className="relative w-full md:w-[80%] lg:w-[60%] xl:w-[40%] flex flex-col items-center">
        {/* face */}
        <div className="relative w-full flex mb-3">
          <Image src='/icons/face.png' className="m-auto" alt="face" width={280} height={280} />
        </div>
        {/* text 1*/}
        <p className="relative w-full text-white text-md md:text-md mb-3">
          Soy Nuvi, nutricionista virtual entrenado por expertos en nutrición deportiva y potenciado por IA.
        </p>
        {/* text 2*/}
        <p className="relative w-full text-white text-md md:text-md mb-5">
          Inicia una consulta conmigo para obtener un plan nutricional personalizado, o también puedes obtener
          planes pre elaborados por deporte y objetivo.
        </p>
        {/* button 1*/}
        <Link
          href="/consulta/iniciar-consulta"
          className="relative block w-[60%] px-6 py-2 rounded-lg text-white mb-1"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          Iniciar Consulta
        </Link>
        {/* button 2 */}
        <Link
          href="/#saber-mas"
          className="relative block w-[60%] px-6 py-2 text-white">
          Saber Más
        </Link>
        

      </div>
      
    </div>
  )
}
