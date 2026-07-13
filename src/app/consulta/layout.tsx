import { ConsultaProvider } from '@/shared'

export default function ConsultaLayout({ children }: { children: React.ReactNode }) {
    return <ConsultaProvider>{children}</ConsultaProvider>
}
