import { ConsultationProvider } from '@/shared'

export default function ConsultationLayout({ children }: { children: React.ReactNode }) {
    return <ConsultationProvider>{children}</ConsultationProvider>
}
