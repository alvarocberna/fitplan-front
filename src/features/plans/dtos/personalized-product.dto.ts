// Ficha pública del plan personalizado (GET plans/personalized del backend,
// nutricionista-virtual-back/src/domain/dtos/product.dto.ts): el producto del que el backend toma el
// monto de la orden de una consulta, así que el precio mostrado es el que se cobra.
export interface PersonalizedProductDto {
    name: string
    description: string
    price: number
    currency: string
}
