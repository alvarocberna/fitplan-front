'use client'
//next
import dynamic from 'next/dynamic'

// @react-pdf/renderer solo puede correr en el navegador, por eso el visor
// se carga con ssr:false en vez de importarlo directo desde '@/features'.
const PreviewPdf = dynamic(
    () => import('@/features/dev/components/preview-pdf').then(m => m.PreviewPdf),
    { ssr: false, loading: () => <span className="text-sm text-gray-400">Cargando vista previa...</span> }
)

export default function PreviewPdfPage() {
    return <PreviewPdf />
}
