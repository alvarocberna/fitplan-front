import { ConsultaProvider } from '@/shared'

export default function DevLayout({ children }: { children: React.ReactNode }) {
    return <ConsultaProvider>{children}</ConsultaProvider>
}
