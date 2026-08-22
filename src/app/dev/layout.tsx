import { ConsultationProvider } from '@/shared'

export default function DevLayout({ children }: { children: React.ReactNode }) {
    return <ConsultationProvider>{children}</ConsultationProvider>
}
