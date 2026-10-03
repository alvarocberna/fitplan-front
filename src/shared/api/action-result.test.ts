import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runAction } from './action-result';
import { ApiError } from './client';

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
});

describe('runAction', () => {
  it('returns { ok: true, data } on success', async () => {
    await expect(runAction(async () => ({ orderId: 'order-1' }))).resolves.toEqual({
      ok: true,
      data: { orderId: 'order-1' },
    });
  });

  it('forwards message, status, code and requestId of an ApiError', async () => {
    const result = await runAction(async () => {
      throw new ApiError('La orden expiró sin pagarse', 409, 'ORDER_EXPIRED', 'req-1');
    });

    expect(result).toEqual({
      ok: false,
      message: 'La orden expiró sin pagarse',
      status: 409,
      code: 'ORDER_EXPIRED',
      requestId: 'req-1',
    });
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('maps a 401 from the backend to code "unauthenticated", whatever the backend code was', async () => {
    const result = await runAction(async () => {
      throw new ApiError('Token inválido o expirado', 401, 'UNAUTHENTICATED', 'req-1');
    });

    expect(result).toMatchObject({ ok: false, status: 401, code: 'unauthenticated' });
  });

  it.each([
    [new ApiError('El servicio no está disponible', 503, 'LLM_UNAVAILABLE', 'req-9')],
    [new ApiError('No pudimos conectar con el servidor', 0, 'NETWORK_ERROR', 'req-9')],
  ])('logs server errors and network failures with the requestId', async (error) => {
    const result = await runAction(async () => {
      throw error;
    });

    expect(result).toMatchObject({ ok: false, message: error.message, code: error.code });
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('req-9'));
  });

  it('never leaks the message of an unexpected (non-ApiError) error: logs it and returns a generic one', async () => {
    const bug = new TypeError("Cannot read properties of undefined (reading 'id')");

    const result = await runAction(async () => {
      throw bug;
    });

    expect(result).toEqual({ ok: false, message: 'Ocurrió un error inesperado. Intenta nuevamente.' });
    expect(consoleError).toHaveBeenCalledWith('[action] error inesperado:', bug);
  });
});
