// 'glass' (por defecto): blanco translúcido con blur, se tiñe con el fondo que tenga detrás (en las
// pantallas de sesión, el celeste `--color-sesion-background`). 'solid': blanco opaco, para las
// pantallas donde las cards deben verse blancas (/panel y /perfil).
const VARIANT_CLASSES = {
  glass: 'bg-white/30 backdrop-blur-md border-white/40',
  solid: 'bg-white border-white',
} as const

interface Props {
  children: React.ReactNode
  width?: string
  widthInner?: string
  height?: string
  variant?: keyof typeof VARIANT_CLASSES
}

export function Card({ children, width = '100%', widthInner = '90%', height = '100%', variant = 'glass' }: Props){
    return(
        <div className={`py-10 flex mx-auto border rounded-[12px] mb-5 shadow-lg ${VARIANT_CLASSES[variant]}`}
        style={{ width, height }}
        >
            <div className="m-auto flex flex-col" style={{ width: widthInner }}>
                {children}
            </div>
        </div>
    )
}
