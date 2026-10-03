import { describe, it, expect, vi, beforeEach } from 'vitest';

function clearCookies() {
  document.cookie.split(';').forEach((c) => {
    const name = c.split('=')[0].trim();
    if (name) document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
  });
}

function jsonResponse(status: number, body: unknown, ok = status >= 200 && status < 300) {
  return { ok, status, statusText: 'x', json: async () => body, text: async () => JSON.stringify(body) } as Response;
}

function emptyResponse(status: number, ok = status >= 200 && status < 300) {
  return { ok, status, statusText: 'x', text: async () => '' } as Response;
}

beforeEach(() => {
  clearCookies();
  vi.resetModules();
});

describe('apiFetchCMS', () => {
  it('adds the CSRF header from an existing cookie without an extra request, only on mutating methods', async () => {
    document.cookie = 'csrf_token=abc123';
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    const { apiFetchCMS } = await import('./client-cms');
    await apiFetchCMS('foo', 'POST', { a: 1 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers['X-CSRF-Token']).toBe('abc123');
  });

  it('does not attach a CSRF header on GET requests', async () => {
    document.cookie = 'csrf_token=abc123';
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, {}));
    vi.stubGlobal('fetch', fetchMock);

    const { apiFetchCMS } = await import('./client-cms');
    await apiFetchCMS('foo', 'GET');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers['X-CSRF-Token']).toBeUndefined();
  });

  it('fetches a CSRF token first when no cookie exists, then sends the mutating request with it', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/auth/csrf-token') return Promise.resolve(jsonResponse(200, { csrfToken: 'fresh-token' }));
      return Promise.resolve(jsonResponse(200, {}));
    });
    vi.stubGlobal('fetch', fetchMock);

    const { apiFetchCMS } = await import('./client-cms');
    await apiFetchCMS('foo', 'POST', {});

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const mainCall = fetchMock.mock.calls.find(([url]) => url !== '/api/auth/csrf-token')!;
    expect(mainCall[1].headers['X-CSRF-Token']).toBe('fresh-token');
  });

  it('sends the mutating request without a CSRF header when fetching the token fails', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/auth/csrf-token') return Promise.reject(new Error('network down'));
      return Promise.resolve(jsonResponse(200, {}));
    });
    vi.stubGlobal('fetch', fetchMock);

    const { apiFetchCMS } = await import('./client-cms');
    const result = await apiFetchCMS('foo', 'POST', {});

    expect(result).toEqual({});
    const mainCall = fetchMock.mock.calls.find(([url]) => url !== '/api/auth/csrf-token')!;
    expect(mainCall[1].headers['X-CSRF-Token']).toBeUndefined();
  });

  it('on 401, refreshes the session once and retries the original request', async () => {
    document.cookie = 'csrf_token=abc123';
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { message: 'expired' }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true })) // /auth/refresh
      .mockResolvedValueOnce(jsonResponse(200, { data: 'after-refresh' })); // retried request
    vi.stubGlobal('fetch', fetchMock);

    const { apiFetchCMS } = await import('./client-cms');
    const result = await apiFetchCMS('foo', 'GET');

    expect(result).toEqual({ data: 'after-refresh' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toBe('/api/auth/refresh');
  });

  it('throws "Sesión expirada" when the refresh call itself fails, without a second retry', async () => {
    document.cookie = 'csrf_token=abc123';
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, {}))
      .mockResolvedValueOnce(jsonResponse(401, {})); // /auth/refresh fails
    vi.stubGlobal('fetch', fetchMock);

    const { apiFetchCMS } = await import('./client-cms');

    await expect(apiFetchCMS('foo', 'GET')).rejects.toThrow('Sesión expirada');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not trigger a second refresh when the retried request itself gets a 401', async () => {
    document.cookie = 'csrf_token=abc123';
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, {}))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true })) // /auth/refresh succeeds
      .mockResolvedValueOnce(jsonResponse(401, { message: 'still unauthorized' })); // retried request also 401s
    vi.stubGlobal('fetch', fetchMock);

    const { apiFetchCMS } = await import('./client-cms');

    await expect(apiFetchCMS('foo', 'GET')).rejects.toThrow('still unauthorized');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('documents that two 401s racing at the exact same time each trigger their own refresh call', async () => {
    // refreshSession() only assigns the module-level `refreshPromise` singleton AFTER an
    // `await ensureCsrfToken()`, so two calls that both observe `refreshPromise` as null before
    // either finishes that await will both proceed to hit /auth/refresh. The singleton only
    // dedupes a second 401 that arrives once the first refresh's promise is already assigned
    // (covered by the single-401 retry test above) — not two 401s racing from the same tick.
    document.cookie = 'csrf_token=abc123';
    let refreshCalls = 0;
    const attemptCounts: Record<string, number> = {};
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/auth/refresh') {
        refreshCalls += 1;
        return Promise.resolve(jsonResponse(200, { ok: true }));
      }
      // first hit for each resource is unauthorized, everything after the refresh succeeds
      attemptCounts[url] = (attemptCounts[url] ?? 0) + 1;
      if (attemptCounts[url] === 1) return Promise.resolve(jsonResponse(401, {}));
      return Promise.resolve(jsonResponse(200, { url }));
    });
    vi.stubGlobal('fetch', fetchMock);

    const { apiFetchCMS } = await import('./client-cms');
    const [r1, r2] = await Promise.all([apiFetchCMS('foo1', 'GET'), apiFetchCMS('foo2', 'GET')]);

    expect(r1).toEqual({ url: '/api/foo1' });
    expect(r2).toEqual({ url: '/api/foo2' });
    expect(refreshCalls).toBe(2);
  });

  it('returns undefined for a 204 and for an empty 200 body, and parses non-empty JSON otherwise', async () => {
    const { apiFetchCMS } = await import('./client-cms');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(emptyResponse(204)));
    await expect(apiFetchCMS('foo', 'GET')).resolves.toBeUndefined();

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(emptyResponse(200)));
    await expect(apiFetchCMS('foo', 'GET')).resolves.toBeUndefined();

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, { hello: 'world' })));
    await expect(apiFetchCMS('foo', 'GET')).resolves.toEqual({ hello: 'world' });
  });

  it('uses NEXT_PUBLIC_BACKEND_CMS_URL as the base URL when running on the server (no window)', async () => {
    vi.stubEnv('NEXT_PUBLIC_BACKEND_CMS_URL', 'https://cms.example.com');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, {}));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('window', undefined);

    const { apiFetchCMS } = await import('./client-cms');
    await apiFetchCMS('bar', 'GET');

    expect(fetchMock).toHaveBeenCalledWith('https://cms.example.com/bar', expect.anything());
  });
});

describe('apiFetchFormData', () => {
  it('sends the FormData body as-is without forcing a Content-Type header', async () => {
    document.cookie = 'csrf_token=abc123';
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    const { apiFetchFormData } = await import('./client-cms');
    const formData = new FormData();
    formData.append('file', 'content');

    await apiFetchFormData('upload', formData, 'POST');

    const [, options] = fetchMock.mock.calls[0];
    expect(options.body).toBe(formData);
    expect(options.headers['Content-Type']).toBeUndefined();
  });

  it('retries once after a successful session refresh on 401', async () => {
    document.cookie = 'csrf_token=abc123';
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, {}))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }))
      .mockResolvedValueOnce(jsonResponse(200, { uploaded: true }));
    vi.stubGlobal('fetch', fetchMock);

    const { apiFetchFormData } = await import('./client-cms');
    const result = await apiFetchFormData('upload', new FormData(), 'POST');

    expect(result).toEqual({ uploaded: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
describe('errores de apiFetchCMS', () => {
  it('throws a CmsApiError carrying the HTTP status and the CMS message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(404, { message: 'Testimonio no encontrado' })));
    const { apiFetchCMS, CmsApiError } = await import('./client-cms');

    const error = await apiFetchCMS('foo', 'GET').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(CmsApiError);
    expect(error).toMatchObject({ message: 'Testimonio no encontrado', status: 404 });
  });

  it('uses a readable message (never "Error HTTP 502") when the error body is not JSON', async () => {
    const htmlResponse = {
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
      json: async () => {
        throw new Error('not json');
      },
    } as unknown as Response;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(htmlResponse));
    const { apiFetchCMS } = await import('./client-cms');

    await expect(apiFetchCMS('foo', 'GET')).rejects.toThrow('Ocurrió un error inesperado. Intenta nuevamente.');
  });

  it('turns a network failure into a CmsApiError with status 0 and a readable message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const { apiFetchCMS } = await import('./client-cms');

    const error = await apiFetchCMS('foo', 'GET').catch((e: unknown) => e);

    expect(error).toMatchObject({ name: 'CmsApiError', status: 0 });
    expect((error as Error).message).toContain('No pudimos conectar');
  });

  it('treats a network failure of the refresh call itself as "session expired" instead of leaking it', async () => {
    document.cookie = 'csrf_token=abc123';
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, {}))
      .mockRejectedValueOnce(new TypeError('Failed to fetch')); // /auth/refresh sin red
    vi.stubGlobal('fetch', fetchMock);
    const { apiFetchCMS } = await import('./client-cms');

    await expect(apiFetchCMS('foo', 'GET')).rejects.toMatchObject({ message: 'Sesión expirada', status: 401 });
  });

  it('does not write debug traces to the console while refreshing', async () => {
    document.cookie = 'csrf_token=abc123';
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(401, {}))
        .mockResolvedValueOnce(jsonResponse(200, { ok: true }))
        .mockResolvedValueOnce(jsonResponse(200, { ok: true })),
    );
    const { apiFetchCMS } = await import('./client-cms');

    await apiFetchCMS('foo', 'GET');

    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });
});

