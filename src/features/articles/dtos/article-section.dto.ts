
export abstract class CreateArticleSectionDtoPublic{
        abstract nro_seccion: number;
        abstract titulo_sec: string;
        abstract contenido_sec: string;
        abstract image_url: string | null;
        abstract image_alt: string | null;
        abstract image_position: string | null;
}

export abstract class UpdateArticleSectionDtoPublic{
        abstract nro_seccion: number;
        abstract titulo_sec: string;
        abstract contenido_sec: string;
        abstract image_url: string | null;
        abstract image_alt: string | null;
        abstract image_position: string | null;
}