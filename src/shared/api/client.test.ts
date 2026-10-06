import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch, ApiError, GENERIC_ERROR_MESSAGE, NETWORK_ERROR_MESSAGE } from './client';

function mockFetchOnce(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  const fetchMock = vi.fn().mockResolvedValue(response as Response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const caught = (promise: Promise<unknown>) => promise.catch((err: unknown) => err) as Promise<ApiError>;

beforeEach(() => {
  vi.stubEnv('BACKEND_URL', 'https://api.consultation.test');
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('apiFetch', () => {
  it('builds the URL from the backend env var, the /api/v1 prefix and the endpoint, with method/headers/body', async () => {
    const fetchMock = mockFetchOnce({ ok: true, status: 200, json: async () => ({ ok: true }) });

    await apiFetch('consultations', 'POST', { foo: 'bar' });

    expect(fetchMock).toHaveBeenCalledWith('https://api.consultation.test/api/v1/consultations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-request-id': expect.any(String) },
      body: JSON.stringify({ foo: 'bar' }),
      signal: expect.any(AbortSignal),
    });
  });

  it('attaches the access token as a Bearer Authorization header', async () => {
    const fetchMock = mockFetchOnce({ ok: true, status: 200, json: async () => ({}) });

    await apiFetch('me', 'GET', undefined, 'token-1');

    expect(fetchMock.mock.calls[0][1].headers).toMatchObject({ Authorization: 'Bearer token-1' });
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

  describe('errores del backend (contrato { statusCode, code, message, errors?, requestId })', () => {
    it('throws an ApiError with the backend message, status, code, requestId and errors', async () => {
      mockFetchOnce({
        ok: false,
        status: 400,
        json: async () => ({
          statusCode: 400,
          code: 'VALIDATION_ERROR',
          message: 'Los datos enviados no son válidos',
          errors: ['weight must be a number'],
          requestId: 'req-backend-1',
        }),
      });

      const error = await caught(apiFetch('consultations/chat', 'POST', {}));

      expect(error).toBeInstanceOf(ApiError);
      expect(error).toMatchObject({
        message: 'Los datos enviados no son válidos',
        status: 400,
        code: 'VALIDATION_ERROR',
        requestId: 'req-backend-1',
        errors: ['weight must be a number'],
      });
    });

    it('carries the HTTP status so callers can tell a 404 apart', async () => {
      mockFetchOnce({ ok: false, status: 404, json: async () => ({ code: 'NOT_FOUND', message: 'Consulta no encontrada' }) });

      const error = await caught(apiFetch('me/consultations/x', 'GET'));

      expect(error).toMatchObject({ message: 'Consulta no encontrada', status: 404, code: 'NOT_FOUND' });
    });

    it('falls back to its own requestId when the error body has none', async () => {
      const fetchMock = mockFetchOnce({ ok: false, status: 404, json: async () => ({ message: 'x' }) });

      const error = await caught(apiFetch('me', 'GET'));

      expect(error.requestId).toBe(fetchMock.mock.calls[0][1].headers['x-request-id']);
    });

    it('never shows a message that is not a string (legacy array format): uses a default in Spanish', async () => {
      mockFetchOnce({ ok: false, status: 400, json: async () => ({ message: ['property x should not exist'] }) });

      const error = await caught(apiFetch('consultations', 'POST', {}));

      expect(error.message).toBe(GENERIC_ERROR_MESSAGE);
    });

    it.each([
      [500, 'El servicio no está disponible en este momento. Intenta nuevamente en unos minutos.'],
      [502, 'El servicio no está disponible en este momento. Intenta nuevamente en unos minutos.'],
      [401, 'Tu sesión expiró. Inicia sesión nuevamente.'],
      [404, 'No encontramos lo que buscas.'],
      [403, GENERIC_ERROR_MESSAGE],
    ])('uses a readable default (never "Error HTTP %i") when the error body is not JSON', async (status, message) => {
      mockFetchOnce({
        ok: false,
        status,
        statusText: 'Whatever',
        json: async () => {
          throw new Error('not json');
        },
      });

      const error = await caught(apiFetch('consultations/chat', 'POST', {}));

      expect(error.message).toBe(message);
      expect(error.status).toBe(status);
    });
  });

  describe('sin respuesta del backend', () => {
    it('turns a network failure ("fetch failed") into an ApiError NETWORK_ERROR with a readable message', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));

      const error = await caught(apiFetch('me', 'GET'));

      expect(error).toBeInstanceOf(ApiError);
      expect(error).toMatchObject({ message: NETWORK_ERROR_MESSAGE, status: 0, code: 'NETWORK_ERROR' });
      expect(error.message).not.toContain('fetch failed');
    });

    it('turns a timeout into an ApiError TIMEOUT', async () => {
      const timeout = Object.assign(new Error('The operation was aborted due to timeout'), { name: 'TimeoutError' });
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(timeout));

      const error = await caught(apiFetch('consultations/chat', 'POST', {}));

      expect(error).toMatchObject({ status: 0, code: 'TIMEOUT' });
      expect(error.message).toContain('tardó demasiado');
    });

    it('turns a 2xx body that is not JSON into an ApiError INVALID_RESPONSE', async () => {
      mockFetchOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('Unexpected token <');
        },
      });

      const error = await caught(apiFetch('me', 'GET'));

      expect(error).toMatchObject({ message: GENERIC_ERROR_MESSAGE, code: 'INVALID_RESPONSE' });
    });
  });
});
