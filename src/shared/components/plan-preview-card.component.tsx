import { DocumentTextIcon } from '@heroicons/react/24/outline'

interface PlanPreviewCardProps {
    // URL firmada de descarga del PDF completo (el backend la firma con Content-Disposition: attachment).
    pdfUrl: string
    // URL firmada de la miniatura (página 1 del plan, WebP generada por el backend); null si el plan
    // no tiene miniatura (generado antes de esta función, o falló su rasterización).
    thumbnailUrl: string | null
    // Fecha de generación (ISO). Opcional: /ordenes/[id] no la conoce y muestra la tarjeta sin subtítulo.
    creationDate?: string
}

// Tarjeta de un plan nutricional: miniatura de la página 1 y un botón que descarga el PDF completo.
// Se usa en /panel (una por plan) y en /ordenes/[id] (el plan recién generado). El atributo
// `download` solo no alcanza para descargar (se ignora en cross-origin): es el Content-Disposition
// de la URL firmada el que fuerza la descarga. Ambas URLs son firmadas y de corta duración.
export function PlanPreviewCard({ pdfUrl, thumbnailUrl, creationDate }: PlanPreviewCardProps) {
    const fecha = creationDate
        ? new Date(creationDate).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
          })
        : null
    // Tolera un backend que aún no envía el campo (despliegue escalonado): cae al placeholder.
    const thumbnail = thumbnailUrl ?? null

    return (
        <div className="w-full flex flex-col items-center gap-3">
            {fecha && <p className="text-sm text-zinc-500 text-center">Generado el {fecha}</p>}

            <div className="w-full max-w-[260px] shrink-0 aspect-[210/297] rounded-[8px] border border-white/40 bg-white shadow-md overflow-hidden">
                {thumbnail ? (
                    // <img> plano y no next/image: la URL firmada cambia en cada request y el
                    // optimizador de Next la proxiaría/cachearía (contenido privado del usuario).
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={thumbnail}
                        alt={
                            fecha
                                ? `Vista previa del plan nutricional generado el ${fecha}`
                                : 'Vista previa de tu plan nutricional'
                        }
                        loading="lazy"
                        className="w-full h-full object-cover object-top"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-400">
                        <DocumentTextIcon className="w-12 h-12" aria-hidden="true" />
                        <p className="text-sm">Vista previa no disponible</p>
                    </div>
                )}
            </div>

            <a
                href={pdfUrl}
                download
                aria-label={fecha ? `Descargar plan nutricional del ${fecha}` : 'Descargar plan nutricional'}
                // h-10! (important): .primary-btn de globals.css fija height:100% sin @layer, lo que
                // dentro de una grilla resolvería al alto de toda la tarjeta y aplastaría la miniatura.
                className="btn primary-btn h-10! w-full max-w-[260px] no-underline"
            >
                Descargar
            </a>
        </div>
    )
}
