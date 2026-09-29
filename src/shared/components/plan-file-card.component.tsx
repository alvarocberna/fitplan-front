'use client'
//next
import Link from 'next/link'
import { usePathname } from 'next/navigation'
//icons
import { DocumentTextIcon } from '@heroicons/react/24/outline'

interface PlanFileCardProps {
    pdfUrl: string
    thumbnailUrl: string | null
}

// Card del PDF en dos mitades iguales: miniatura de la página 1 a la izquierda (su alto sigue la proporción
// A4) y a la derecha "Plan nutricional", "PDF" y el botón de descarga. La descarga la fuerza el
// Content-Disposition de la URL firmada (el atributo `download` se ignora en cross-origin). Se usa en el
// detalle del plan (/planes/[orderId]) y al terminar la generación (/ordenes/[id]); solo en esta última
// muestra además "Ir a inicio" (→ /inicio).
export function PlanFileCard({ pdfUrl, thumbnailUrl }: PlanFileCardProps) {
    const pathname = usePathname()
    const isOrderPage = pathname?.startsWith('/ordenes/') ?? false

    return (
        <section
            aria-label="Archivo del plan"
            className="w-full bg-white border border-white rounded-[12px] shadow-lg p-5 grid grid-cols-2 gap-4"
        >
            <div className="w-full aspect-[210/297] rounded-[8px] border border-zinc-200 bg-white shadow-sm overflow-hidden">
                {thumbnailUrl ? (
                    // <img> plano y no next/image: la URL firmada cambia en cada request y el optimizador
                    // de Next la proxiaría/cachearía (contenido privado del usuario).
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={thumbnailUrl}
                        alt="Vista previa de tu plan nutricional"
                        loading="lazy"
                        className="w-full h-full object-cover object-top"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-zinc-400 p-2 text-center">
                        <DocumentTextIcon className="w-8 h-8" aria-hidden="true" />
                        <p className="text-[11px]">Vista previa no disponible</p>
                    </div>
                )}
            </div>
            {/* título, formato y botones alineados arriba, a la altura del borde superior de la miniatura */}
            <div className="min-w-0 flex flex-col gap-4 self-start">
                <div className="flex flex-col gap-1">
                    <p className="font-semibold text-zinc-900">Plan nutricional</p>
                    <p className="text-sm text-zinc-500">PDF</p>
                </div>
                <a
                    href={pdfUrl}
                    download
                    aria-label="Descargar plan nutricional"
                    // h-10! (important): .primary-btn de globals.css fija height:100% sin @layer
                    className="btn primary-btn h-10! w-full no-underline"
                >
                    Descargar plan
                </a>
                {isOrderPage && (
                    <Link href="/inicio" className="btn secondary-btn h-10! w-full no-underline">
                        Ir a inicio
                    </Link>
                )}
            </div>
        </section>
    )
}
