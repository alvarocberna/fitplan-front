import { ArticleEntityPublic } from "./article.entity";

export class ArticlesEntityPublic {
    constructor(
        public id: string,
        public titulo: string,
        public descripcion: string | null,
        public activo: boolean,
        public aprobar: boolean,
        public notificacion: boolean,
        public proyecto_id: string,
        public articulo: ArticleEntityPublic[],
    ) {}
}
