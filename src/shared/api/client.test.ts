import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch } from './client';

function mockFetchOnce(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  const fetchMock = vi.fn().mockResolvedValue(response as Response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.stubEnv('BACKEND_URL', 'https://api.consultation.test');
});

describe('apiFetch', () => {
  it('builds the URL from the backend env var and the endpoint, with method/headers/body', async () => {
    const fetchMock = mockFetchOnce({ ok: true, status: 200, json: async () => ({ ok: true }) });

    await apiFetch('ordenes/crear', 'POST', { foo: 'bar' });

    expect(fetchMock).toHaveBeenCalledWith('https://api.consultation.test/ordenes/crear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foo: 'bar' }),
    });
  });

  it('omits the body when no data is passed', async () => {
    const fetchMock = mockFetchOnce({ ok: true, status: 200, json: async () => ({}) });

    await apiFetch('ordenes/obtener-estado/123', 'GET');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.consultation.test/ordenes/obtener-estado/123',
      expect.objectContaining({ body: undefined })
    );
  });

  it('returns undefined on a 204 without parsing the body', async () => {
    const jsonSpy = vi.fn();
    mockFetchOnce({ ok: true, status: 204, json: jsonSpy });

    const result = await apiFetch('webhooks/ordenes/1/simular-pago', 'POST');

    expect(result).toBeUndefined();
    expect(jsonSpy).not.toHaveBeenCalled();
  });

  it('returns the parsed JSON body on success', async () => {
    mockFetchOnce({ ok: true, status: 200, json: async () => ({ orderId: 'order-1' }) });

    const result = await apiFetch<{ orderId: string }>('ordenes/crear', 'POST', {});

    expect(result).toEqual({ orderId: 'order-1' });
  });

  it('throws using the "message" field from the error body', async () => {
    mockFetchOnce({ ok: false, status: 400, statusText: 'Bad Request', json: async () => ({ message: 'Datos inválidos' }) });

    await expect(apiFetch('consulta/chat', 'POST', {})).rejects.toThrow('Datos inválidos');
  });

  it('throws using the "error" field when "message" is absent', async () => {
    mockFetchOnce({ ok: false, status: 400, statusText: 'Bad Request', json: async () => ({ error: 'Falló la validación' }) });

    await expect(apiFetch('consulta/chat', 'POST', {})).rejects.toThrow('Falló la validación');
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

    await expect(apiFetch('consulta/chat', 'POST', {})).rejects.toThrow('Error HTTP 500: Internal Server Error');
  });

  it('falls back to a generic HTTP message when the error body has neither message nor error', async () => {
    mockFetchOnce({ ok: false, status: 403, statusText: 'Forbidden', json: async () => ({ unrelated: true }) });

    await expect(apiFetch('consulta/chat', 'POST', {})).rejects.toThrow('Error HTTP 403');
  });
});
