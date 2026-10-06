import { describe, it, expect, vi, beforeEach } from 'vitest';
import { redirect } from 'next/navigation';
import { withSession } from './with-session';
import { ActionError, SessionRequiredError } from '../api/unwrap';

vi.mock('next/navigation', () => ({
  // como el redirect real de Next: corta la ejecución lanzando
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

beforeEach(() => {
  vi.mocked(redirect).mockClear();
});

describe('withSession', () => {
  it('returns what the loader returns', async () => {
    await expect(withSession(async () => ({ plans: [] }))).resolves.toEqual({ plans: [] });
    expect(redirect).not.toHaveBeenCalled();
  });

  it('redirects to /login when the loader fails because the session expired', async () => {
    await expect(
      withSession(async () => {
        throw new SessionRequiredError('Tu sesión expiró');
      }),
    ).rejects.toThrow('NEXT_REDIRECT:/login?error=session_expired');
  });

  it('rethrows any other error untouched (it goes to the error boundary)', async () => {
    const error = new ActionError('El servicio no está disponible', 503);

    await expect(
      withSession(async () => {
        throw error;
      }),
    ).rejects.toBe(error);
    expect(redirect).not.toHaveBeenCalled();
  });
});
