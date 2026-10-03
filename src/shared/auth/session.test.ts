import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { jwtVerify } from 'jose';
import { hasValidSession } from './session';

vi.mock('next/headers', () => ({ cookies: vi.fn() }));
// jose se mockea: bajo jsdom su chequeo de tipo de la clave falla (Uint8Array de otro realm). Acá
// solo interesa qué hace session.ts con el resultado de la verificación y con el secreto.
vi.mock('jose', async (importOriginal) => {
  const actual = await importOriginal<typeof import('jose')>();
  return { ...actual, jwtVerify: vi.fn() };
});

const jwtVerifyMock = vi.mocked(jwtVerify);

beforeEach(() => {
  jwtVerifyMock.mockReset();
  vi.stubEnv('SESSION_SECRET', 'test-session-secret-0123456789abcdef');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('hasValidSession', () => {
  it('is true when the token verifies and carries userInfo', async () => {
    jwtVerifyMock.mockResolvedValue({ payload: { userInfo: { email: 'ana@test.com' } } } as never);

    await expect(hasValidSession('token')).resolves.toBe(true);
  });

  it('is false when the token does not verify (bad signature, corrupt, expired) or has no userInfo', async () => {
    jwtVerifyMock.mockRejectedValueOnce(new Error('signature verification failed'));
    await expect(hasValidSession('token')).resolves.toBe(false);

    jwtVerifyMock.mockResolvedValueOnce({ payload: {} } as never);
    await expect(hasValidSession('token')).resolves.toBe(false);
  });

  it('throws (instead of pretending there is no session) when SESSION_SECRET is missing', async () => {
    vi.stubEnv('SESSION_SECRET', '');

    await expect(hasValidSession('token')).rejects.toThrow('SESSION_SECRET');
    expect(jwtVerifyMock).not.toHaveBeenCalled();
  });
});
