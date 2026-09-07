import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ArticlesServicePublic } from './articles.service';
import { apiFetchCMS } from '@/shared';

vi.mock('@/shared', () => ({ apiFetchCMS: vi.fn() }));

const mockedFetch = vi.mocked(apiFetchCMS);

beforeEach(() => {
  mockedFetch.mockReset();
  vi.stubEnv('NEXT_PUBLIC_PROYECTO_ID', 'proj-1');
});

describe('ArticlesServicePublic', () => {
  it('getArticles requests the project article list with the project id', async () => {
    mockedFetch.mockResolvedValue({ articulo: [] } as any);

    await ArticlesServicePublic.getArticles();

    expect(mockedFetch).toHaveBeenCalledWith('articulos/project/ver-todo?proyecto_id=proj-1', 'GET');
  });

  it('getArticleById requests a single article by id with the project id', async () => {
    mockedFetch.mockResolvedValue({} as any);

    await ArticlesServicePublic.getArticleById('art-1');

    expect(mockedFetch).toHaveBeenCalledWith('articulos/project/ver/art-1?proyecto_id=proj-1', 'GET');
  });

  it('getArticleBySlug returns the article whose slug matches, out of the full list', async () => {
    const match = { slug: 'como-bajar-de-peso' } as any;
    mockedFetch.mockResolvedValue({ articulo: [{ slug: 'otro-articulo' }, match] } as any);

    const result = await ArticlesServicePublic.getArticleBySlug('como-bajar-de-peso');

    expect(result).toBe(match);
  });

  it('getArticleBySlug throws when no article matches the given slug', async () => {
    mockedFetch.mockResolvedValue({ articulo: [{ slug: 'otro-articulo' }] } as any);

    await expect(ArticlesServicePublic.getArticleBySlug('inexistente')).rejects.toThrow('Artículo no encontrado');
  });
});
