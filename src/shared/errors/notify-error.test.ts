import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toast } from 'react-toastify';
import { notifyError, SESSION_EXPIRED_LOGIN_URL } from './notify-error';
import { ActionError, SessionRequiredError } from '../api/unwrap';

vi.mock('react-toastify', () => ({ toast: { error: vi.fn() } }));

const assign = vi.fn();

beforeEach(() => {
  vi.mocked(toast.error).mockClear();
  assign.mockClear();
  vi.stubGlobal('location', { ...window.location, assign });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('notifyError', () => {
  it('shows the error message in a toast that stays longer than the default', () => {
    const redirected = notifyError(new ActionError('Los kg deben ser menores que el peso', 400), 'No se pudo guardar');

    expect(redirected).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('Los kg deben ser menores que el peso', { autoClose: 6000 });
    expect(assign).not.toHaveBeenCalled();
  });

  it.each([[new Error('')], ['un string'], [null], [undefined]])(
    'uses the fallback when the error carries no message (%s)',
    (error) => {
      notifyError(error, 'No se pudo guardar');

      expect(toast.error).toHaveBeenCalledWith('No se pudo guardar', expect.anything());
    },
  );

  it('sends the user to login (no toast) when the session expired', () => {
    const redirected = notifyError(new SessionRequiredError('Tu sesión expiró'), 'No se pudo guardar');

    expect(redirected).toBe(true);
    expect(assign).toHaveBeenCalledWith(SESSION_EXPIRED_LOGIN_URL);
    expect(toast.error).not.toHaveBeenCalled();
  });
});
