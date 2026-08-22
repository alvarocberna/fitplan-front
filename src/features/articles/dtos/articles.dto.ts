
export abstract class CreateArticlesDtoPublic{
        abstract titulo: string;
        abstract descripcion: string;
        abstract activo: boolean;
        abstract aprobar: boolean;
        abstract notificacion: boolean;
}

export abstract class UpdateArticlesDtoPublic{
        abstract titulo: string;
        abstract descripcion: string;
        abstract activo: boolean;
        abstract aprobar: boolean;
        abstract notificacion: boolean;
}