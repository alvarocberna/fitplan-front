import { ConsultaProvider } from '@/features/consulta/context/consulta.context'

export default function ConsultaLayout({ children }: { children: React.ReactNode }) {
    return <ConsultaProvider>{children}</ConsultaProvider>
}
