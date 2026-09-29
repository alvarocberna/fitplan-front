//features - dashboard
import { ICON_CIRCLE_STYLE } from '../plan-icons'

interface CardTitleProps {
    // ícono de Heroicons (outline)
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
    title: string
}

// Título interno de las cards de inicio: ícono en un círculo con el tinte del color primario y el título.
export function CardTitle({ icon: Icon, title }: CardTitleProps) {
    return (
        <div className="flex items-center gap-3">
            <span aria-hidden="true" className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center" style={ICON_CIRCLE_STYLE}>
                <Icon className="h-5 w-5" />
            </span>
            <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
        </div>
    )
}
