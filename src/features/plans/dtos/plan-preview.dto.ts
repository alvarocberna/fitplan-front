// Ficha pública de vista previa de un plan predefinido, una por familia (GET productos/vista-previa
// del backend). Es lo que muestra el carrusel del home: no incluye precio/moneda (no se muestran
// ahí) ni pdfKey/thumbnailKey (el backend nunca los expone).
export interface PlanPreviewDto {
    code: string
    name: string
    description: string
    //URL firmada (corta duración) de la miniatura de la familia; null si aún no tiene
    thumbnailUrl: string | null
}
