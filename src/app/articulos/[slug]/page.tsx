import { notFound } from 'next/navigation';
import { ArticlesServicePublic, ArticlePublic } from '@/features';

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {

    const { slug } = await params;

    const article = await ArticlesServicePublic.getArticleBySlug(slug)
    if (!article) notFound()

    return (
        <div className="flex flex-col">
            <ArticlePublic articleData={article} />
        </div>
    );
}