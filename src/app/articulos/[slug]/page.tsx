import { ArticlesServicePublic, ArticlePublic } from '@/features';

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {

    const { slug } = await params;

    const [article] = await Promise.all([
        ArticlesServicePublic.getArticleBySlug(slug)
    ])

    return (
        <div className="flex flex-col">
            <ArticlePublic articleData={article} />
        </div>
    );
}