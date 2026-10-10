import { ArticlesAllPublic, ArticlesServicePublic } from '@/features';

// Se renderiza en cada petición y no en el build: los artículos vienen del CMS, y si el CMS no está
// disponible al construir, el prerender falla y corta el build completo.
export const dynamic = 'force-dynamic'

export default async function ArticlesPage() {

    const [articles] = await Promise.all([
        ArticlesServicePublic.getArticles()
    ])

    return (
        <div className="flex flex-col">
            <ArticlesAllPublic articlesData={articles} />
        </div>
    );
}