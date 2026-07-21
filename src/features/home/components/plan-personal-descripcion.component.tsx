export function PlanPersonalDescripcion() {
  return (
    <div id="plan-nutricional-personalizado" className="w-full min-h-screen flex flex-col items-center justify-center text-center px-6">
      <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">
        Plan nutricional personalizado
      </h2>
      <p className="text-xl md:text-2xl font-bold text-white mb-6">
        ¿Qué incluye?
      </p>

      <div className="w-2xl flex flex-wrap justify-between mb-6">
          {/* div 1 */}
          <div className="flex items-center w-full md:w-[48%] mb-6 gap-4 rounded-lg px-4 py-2 mb- border bg-white/30 backdrop-blur-md border-white/40">
            <div className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {/* <FontAwesomeIcon icon={item.icon} style={{ color: 'white', width: '18px', height: '18px' }} /> */}
            </div>
            <p className="font-medium text-md text-left text-zinc-900" style={{textAlign: 'justify'}}>
              Calculo de requerimientos energéticos y macro nutrientes.
            </p>
          </div>
          {/* div 2 */}
          <div className="flex items-center w-full md:w-[48%] mb-6 gap-4 rounded-lg px-4 py-2 mb- border bg-white/30 backdrop-blur-md border-white/40">
            <div className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {/* <FontAwesomeIcon icon={item.icon} style={{ color: 'white', width: '18px', height: '18px' }} /> */}
            </div>
            <p className="font-medium text-md text-left text-zinc-900" style={{textAlign: 'justify'}}>
              Plan nutricional por tiempo de comida y ejemplos.
            </p>
          </div>
          {/* div 3 */}
          <div className="flex items-center w-full md:w-[48%] mb-6 gap-4 rounded-lg px-4 py-2 mb- border bg-white/30 backdrop-blur-md border-white/40">
            <div className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {/* <FontAwesomeIcon icon={item.icon} style={{ color: 'white', width: '18px', height: '18px' }} /> */}
            </div>
            <p className="font-medium text-md text-left text-zinc-900" style={{textAlign: 'justify'}}>
              Suplementación deportiva
            </p>
          </div>
          {/* div 4 */}
          <div className="flex items-center w-full md:w-[48%] mb-6 gap-4 rounded-lg px-4 py-2 mb- border bg-white/30 backdrop-blur-md border-white/40">
            <div className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {/* <FontAwesomeIcon icon={item.icon} style={{ color: 'white', width: '18px', height: '18px' }} /> */}
            </div>
            <p className="font-medium text-md text-left text-zinc-900" style={{textAlign: 'justify'}}>
              Estrategias deportivas para entrenamientos y competencias
            </p>
          </div>
          {/* div 5 */}
          {/* <div className="flex items-center gap-4 rounded-lg px-4 py-2 mb- border bg-white/30 backdrop-blur-md border-white/40">
            <div className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
            </div>
            <p className="font-medium text-md text-left text-zinc-900" style={{textAlign: 'justify'}}>
              Ver ejemplo plan 
            </p>
          </div> */}

      </div>
    </div>
  )
}
