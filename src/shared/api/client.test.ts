import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch, ApiError } from './client';

function mockFetchOnce(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  const fetchMock = vi.fn().mockResolvedValue(response as Response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.stubEnv('BACKEND_URL', 'https://api.consultation.test');
});

describe('apiFetch', () => {
  it('builds the URL from the backend env var, the /api/v1 prefix and the endpoint, with method/headers/body', async () => {
    const fetchMock = mockFetchOnce({ ok: true, status: 200, json: async () => ({ ok: true }) });

    await apiFetch('consultations', 'POST', { foo: 'bar' });

    expect(fetchMock).toHaveBeenCalledWith('https://api.consultation.test/api/v1/consultations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foo: 'bar' }),
    });
  });

  it('omits the body when no data is passed', async () => {
    const fetchMock = mockFetchOnce({ ok: true, status: 200, json: async () => ({}) });

    await apiFetch('orders/123/status', 'GET');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.consultation.test/api/v1/orders/123/status',
      expect.objectContaining({ body: undefined })
    );
  });

  it('returns undefined on a 204 without parsing the body', async () => {
    const jsonSpy = vi.fn();
    mockFetchOnce({ ok: true, status: 204, json: jsonSpy });

    const result = await apiFetch('dev/orders/1/simulate-payment', 'POST');

    expect(result).toBeUndefined();
    expect(jsonSpy).not.toHaveBeenCalled();
  });

  it('returns the parsed JSON body on success', async () => {
    mockFetchOnce({ ok: true, status: 200, json: async () => ({ orderId: 'order-1' }) });

    const result = await apiFetch<{ orderId: string }>('consultations', 'POST', {});

    expect(result).toEqual({ orderId: 'order-1' });
  });

  it('throws using the "message" field from the error body', async () => {
    mockFetchOnce({ ok: false, status: 400, statusText: 'Bad Request', json: async () => ({ message: 'Datos inválidos' }) });

    await expect(apiFetch('consultations/chat', 'POST', {})).rejects.toThrow('Datos inválidos');
  });

  it('throws using the "error" field when "message" is absent', async () => {
    mockFetchOnce({ ok: false, status: 400, statusText: 'Bad Request', json: async () => ({ error: 'Falló la validación' }) });

    await expect(apiFetch('consultations/chat', 'POST', {})).rejects.toThrow('Falló la validación');
  });

  it('falls back to a generic HTTP message when the error body is not JSON', async () => {
    mockFetchOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => {
        throw new Error('not json');
      },
    });

    await expect(apiFetch('consultations/chat', 'POST', {})).rejects.toThrow('Error HTTP 500: Internal Server Error');
  });

  it('falls back to a generic HTTP message when the error body has neither message nor error', async () => {
    mockFetchOnce({ ok: false, status: 403, statusText: 'Forbidden', json: async () => ({ unrelated: true }) });

    await expect(apiFetch('consultations/chat', 'POST', {})).rejects.toThrow('Error HTTP 403');
  });

  it('throws an ApiError carrying the HTTP status', async () => {
    mockFetchOnce({ ok: false, status: 404, statusText: 'Not Found', json: async () => ({ message: 'Consulta no encontrada' }) });

    const error = await apiFetch('me/consultations/x', 'GET').catch((err: unknown) => err);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ message: 'Consulta no encontrada', status: 404 });
  });
});
