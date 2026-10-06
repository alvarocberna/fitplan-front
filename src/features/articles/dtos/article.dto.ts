
import {CreateArticleSectionDtoPublic, UpdateArticleSectionDtoPublic} from './article-section.dto';

export abstract class CreateArticleFullDtoPublic {
        abstract articulo: CreateArticleDtoPublic;
        abstract sec_articulo: CreateArticleSectionDtoPublic[]
}

export abstract class CreateArticleDtoPublic{
        abstract titulo: string;
        abstract subtitulo: string;
        abstract autor: string;
        abstract fecha_publicacion: Date;
        abstract fecha_actualizacion: Date | null;
        abstract status: string;
        abstract activo: boolean;
        abstract slug: string;
        abstract image_url: string | null;
        abstract image_alt: string | null;
        abstract image_position: string | null;
        abstract sec_articulo: CreateArticleSectionDtoPublic[]
}

export abstract class UpdateArticleDtoPublic{
        abstract titulo: string;
        abstract subtitulo: string;
        abstract autor: string;
        abstract fecha_publicacion: Date;
        abstract fecha_actualizacion: Date | null;
        abstract status: string;
        abstract activo: boolean;
        abstract slug: string;
        abstract image_url: string | null;
        abstract image_alt: string | null;
        abstract image_position: string | null;
        abstract sec_articulo: UpdateArticleSectionDtoPublic[]
}