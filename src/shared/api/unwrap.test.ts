import { describe, it, expect } from 'vitest';
import {
  ActionError,
  SessionRequiredError,
  isNotFoundError,
  isSessionRequiredError,
  unwrap,
  unwrapOrNull,
} from './unwrap';

describe('unwrap', () => {
  it('returns the data of a successful result', () => {
    expect(unwrap({ ok: true, data: { id: 1 } })).toEqual({ id: 1 });
  });

  it('throws an ActionError that keeps message, status, code and requestId', () => {
    const run = () =>
      unwrap({ ok: false, message: 'La orden expiró sin pagarse', status: 409, code: 'ORDER_EXPIRED', requestId: 'req-1' });

    expect(run).toThrow(ActionError);
    try {
      run();
    } catch (error) {
      expect(error).toMatchObject({
        message: 'La orden expiró sin pagarse',
        status: 409,
        code: 'ORDER_EXPIRED',
        requestId: 'req-1',
      });
      expect(error).not.toBeInstanceOf(SessionRequiredError);
    }
  });

  it('throws SessionRequiredError when the action failed for lack of a valid session', () => {
    const run = () => unwrap({ ok: false, message: 'Tu sesión expiró', status: 401, code: 'unauthenticated' });

    expect(run).toThrow(SessionRequiredError);
    expect(run).toThrow('Tu sesión expiró');
  });
});

describe('unwrapOrNull', () => {
  it('returns the data of a successful result', () => {
    expect(unwrapOrNull({ ok: true, data: 'x' })).toBe('x');
  });

  it('returns null for a 404 (missing or not yours)', () => {
    expect(unwrapOrNull({ ok: false, message: 'Consulta no encontrada', status: 404 })).toBeNull();
  });

  it('throws on any other failure', () => {
    expect(() => unwrapOrNull({ ok: false, message: 'Error', status: 500 })).toThrow(ActionError);
    expect(() => unwrapOrNull({ ok: false, message: 'Sesión', status: 401, code: 'unauthenticated' })).toThrow(
      SessionRequiredError,
    );
  });
});

describe('type guards', () => {
  it('isSessionRequiredError recognises the class and an error with that name', () => {
    expect(isSessionRequiredError(new SessionRequiredError('x'))).toBe(true);
    expect(isSessionRequiredError(Object.assign(new Error('x'), { name: 'SessionRequiredError' }))).toBe(true);
    expect(isSessionRequiredError(new ActionError('x', 401))).toBe(false);
    expect(isSessionRequiredError('x')).toBe(false);
  });

  it('isNotFoundError recognises an error with status 404', () => {
    expect(isNotFoundError(new ActionError('x', 404))).toBe(true);
    expect(isNotFoundError(new ActionError('x', 500))).toBe(false);
    expect(isNotFoundError(new Error('x'))).toBe(false);
  });
});
