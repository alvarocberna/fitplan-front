import { ConsultationProvider } from '@/shared'

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
    return <ConsultationProvider>{children}</ConsultationProvider>
}
