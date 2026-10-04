import { notFound } from 'next/navigation'
import { ConsultationProvider } from '@/shared'

// Herramientas de desarrollo (/dev/preview-pdf, /dev/status): muestran y permiten borrar el estado
// local de la consulta. En producción no existen: responden 404.
export default function DevLayout({ children }: { children: React.ReactNode }) {
    if (process.env.NODE_ENV === 'production') notFound()
    return <ConsultationProvider>{children}</ConsultationProvider>
}
