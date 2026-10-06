//precio con el formato del cliente, p. ej. 14990 CLP -> '$14.990'
export function formatPrice(price: number, currency: string): string {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price)
}
