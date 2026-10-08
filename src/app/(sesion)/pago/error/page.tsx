//next
import Link from 'next/link'

// Token de una transacción de Webpay: el único valor que se acepta para armar el enlace de reintento.
const TOKEN = /^[A-Za-z0-9]{1,64}$/

// Destino de /api/webpay/return cuando no se pudo confirmar el pago al volver de Webpay (el backend o
// Transbank no respondieron, o el retorno llegó sin parámetros). Con ?token= el usuario sí llegó a
// pagar: se ofrece reintentar la confirmación, que es idempotente.
export default async function PaymentErrorPage({
    searchParams,
}: {
    searchParams: Promise<{ token?: string | string[] }>
}) {
    const { token } = await searchParams
    const retryToken = typeof token === 'string' && TOKEN.test(token) ? token : null

    return (
        <div className="w-full flex justify-center px-6 py-4">
            <div className="w-full max-w-md border border-zinc-300 rounded-2xl p-8 flex flex-col gap-6 text-left">
                <div>
                    <h1 className="text-xl font-bold text-zinc-800">No pudimos confirmar tu pago</h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        {retryToken
                            ? 'Tuvimos un problema al confirmar tu pago con Webpay. Vuelve a intentarlo: no se te cobrará dos veces.'
                            : 'No recibimos el resultado de tu pago. Revisa el estado de tu compra en el inicio; si no aparece, puedes volver a intentarlo.'}
                    </p>
                </div>
                {retryToken && (
                    // no es una página: es el route handler que confirma el pago, por eso un <a> y no <Link>
                    <a
                        href={`/api/webpay/return?token_ws=${retryToken}`}
                        className="w-full py-2.5 rounded-full text-white text-center font-semibold hover:opacity-90 transition-opacity no-underline"
                        style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                        Reintentar confirmación
                    </a>
                )}
                <Link
                    href="/inicio"
                    className="w-full py-2.5 rounded-full border border-zinc-300 text-zinc-600 text-center font-semibold hover:bg-zinc-50 transition-colors no-underline"
                >
                    Volver al inicio
                </Link>
            </div>
        </div>
    )
}
