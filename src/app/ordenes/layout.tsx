import { ConsultaProvider } from '@/shared'

export default function OrdenesLayout({ children }: { children: React.ReactNode }) {
    return <ConsultaProvider>{children}</ConsultaProvider>
}
