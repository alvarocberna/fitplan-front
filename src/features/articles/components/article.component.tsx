'use client'
//react
import { useState } from "react";
//features
import { ArticleSectionEntityPublic, ArticleSectionPublic, ArticleEntityPublic } from "@/features";
import { PageContainerPublic } from "@/shared";

interface ArticlePublicProps {
    articleData: ArticleEntityPublic | null
}

export function ArticlePublic({articleData}: ArticlePublicProps){

    if (!articleData) return null;

    //fecha
    const fecha = new Date(articleData?.fecha_publicacion);
    const anno = fecha.getFullYear();
    const mes = (fecha.getMonth()+1).toString().padStart(2, "0");
    const dia = fecha.getDay().toString().padStart(2, "0");

    return(
        <PageContainerPublic>
            {articleData && (
                <div className="text-texto m-auto">
                    <h3 className="text-3xl mb-2">{articleData.titulo}</h3>
                    <h4 className="text-xl mb-10">{articleData.subtitulo}</h4>
                    <div>
                        {articleData.sec_articulo.map((data: ArticleSectionEntityPublic, index: number) => (
                            <ArticleSectionPublic key={index} data={data} />
                        ))}
                    </div>
                    <p>Autor: {articleData.autor}</p>
                    <p>Publicado el {dia}/{mes}/{anno}</p>
                </div>
            )}
        </PageContainerPublic>
    )
}