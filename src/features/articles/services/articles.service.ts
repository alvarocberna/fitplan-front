//shared
import {apiFetchCMS} from '@/shared';
//features
import { ArticleEntityPublic, ArticlesEntityPublic } from '@/features';

export class ArticlesServicePublic{

    /*No enviamos params, solo el user_id que se encuentra en el access_token de las cookies*/
    public static async getArticles(): Promise<ArticlesEntityPublic>{
        const projectId = process.env.NEXT_PUBLIC_PROYECTO_ID;
        return await apiFetchCMS<ArticlesEntityPublic>(`articulos/project/ver-todo?proyecto_id=${projectId}`, 'GET')
    }

    public static async getArticleById(articleId: string): Promise<ArticleEntityPublic>{
        const projectId = process.env.NEXT_PUBLIC_PROYECTO_ID;
        return await apiFetchCMS<ArticleEntityPublic>(`articulos/project/ver/${articleId}?proyecto_id=${projectId}`, 'GET')
    }

    // null si no hay un artículo con ese slug (la página responde 404)
    public static async getArticleBySlug(slug: string): Promise<ArticleEntityPublic | null>{
        const articles = await this.getArticles();
        return articles.articulo.find(art => art.slug === slug) ?? null;
    }

}