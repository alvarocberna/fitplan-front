//icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
//shared
import { Card, SubsectionHead, SubsectionTitle, SubsectionBody } from '@/shared'
//features - dashboard
import { ICON_CIRCLE_STYLE } from '../plan-icons'

interface DetailSectionProps {
    title: string
    // Ícono en un círculo a la izquierda del título, que entonces va a la izquierda (sin ícono, centrado).
    icon?: IconDefinition
    children: React.ReactNode
}

// Card de ancho completo con título para las secciones de detalle (plan, consulta).
export function DetailSection({ title, icon, children }: DetailSectionProps) {
    return (
        <Card widthInner="80%" variant="solid">
            <SubsectionHead>
                {icon ? <IconSectionTitle icon={icon} title={title} /> : <SubsectionTitle title={title} />}
            </SubsectionHead>
            <SubsectionBody>{children}</SubsectionBody>
        </Card>
    )
}

// Título de sección alineado a la izquierda con un ícono en un círculo (tinte del color primario). Lo usan
// DetailSection y /perfil.
export function IconSectionTitle({ icon, title }: { icon: IconDefinition; title: string }) {
    return (
        <div className="w-full flex items-center gap-3 text-left">
            <span
                aria-hidden="true"
                className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center"
                style={ICON_CIRCLE_STYLE}
            >
                <FontAwesomeIcon icon={icon} className="h-5 w-5" />
            </span>
            {/* mismo estilo que SubsectionTitle (que se centra solo con mx-auto) */}
            <h2 className="text-xl font-bold text-zinc-900">{title}</h2>
        </div>
    )
}
