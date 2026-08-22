import { ArticlesAllPublic, ArticlesServicePublic } from '@/features';

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