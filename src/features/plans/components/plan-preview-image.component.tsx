//next
import Image from 'next/image'

interface PlanPreviewImageProps {
    //URL firmada de la miniatura de la versión del plan (la entrega el backend); null si aún no tiene
    thumbnailUrl: string | null
    //imagen estática del plan que se muestra mientras no hay miniatura de la versión
    fallbackSrc: string
    alt: string
}

// Vista previa de un plan predefinido: la miniatura de la versión elegida, o la imagen estática del plan
// si esa versión todavía no tiene miniatura.
export function PlanPreviewImage({ thumbnailUrl, fallbackSrc, alt }: PlanPreviewImageProps) {
    if (thumbnailUrl) {
        // <img> plano y no next/image: la URL firmada cambia en cada request y el optimizador de Next
        // la proxiaría/cachearía (el bucket es privado y su host no está en images.remotePatterns).
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={thumbnailUrl} alt={alt} className="w-full h-auto rounded-2xl" />
    }
    return <Image src={fallbackSrc} alt={alt} width={620} height={877} className="w-full h-auto rounded-2xl" />
}
