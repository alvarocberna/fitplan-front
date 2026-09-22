// Ficha pública de una versión de plan predefinido (GET productos/predefinidos/:code del backend).
// El backend no expone el PDF ni sus keys: solo lo necesario para mostrar el plan antes de comprar.
export interface PredefinedProductDto {
    code: string
    name: string
    description: string
    price: number
    currency: string
    //URL firmada (corta duración) de la miniatura de la versión; null si aún no tiene
    thumbnailUrl: string | null
}
