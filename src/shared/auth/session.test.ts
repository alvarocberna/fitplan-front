import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { jwtDecrypt } from 'jose';
import { hasValidSession } from './session';

vi.mock('next/headers', () => ({ cookies: vi.fn() }));
// jose se mockea: bajo jsdom su chequeo de tipo de la clave falla (Uint8Array de otro realm). Acá
// solo interesa qué hace session.ts con el resultado de la verificación y con el secreto.
vi.mock('jose', async (importOriginal) => {
  const actual = await importOriginal<typeof import('jose')>();
  return { ...actual, jwtDecrypt: vi.fn() };
});

const jwtVerifyMock = vi.mocked(jwtDecrypt);

beforeEach(() => {
  jwtVerifyMock.mockReset();
  vi.stubEnv('SESSION_SECRET', 'test-session-secret-0123456789abcdef');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('hasValidSession', () => {
  it('is true when the cookie decrypts and carries userInfo', async () => {
    jwtVerifyMock.mockResolvedValue({ payload: { userInfo: { email: 'ana@test.com' } } } as never);

    await expect(hasValidSession('token')).resolves.toBe(true);
  });

  it('is false when the cookie does not decrypt (tampered, corrupt, other key, expired) or has no userInfo', async () => {
    jwtVerifyMock.mockRejectedValueOnce(new Error('decryption operation failed'));
    await expect(hasValidSession('token')).resolves.toBe(false);

    jwtVerifyMock.mockResolvedValueOnce({ payload: {} } as never);
    await expect(hasValidSession('token')).resolves.toBe(false);
  });

  it('throws (instead of pretending there is no session) when SESSION_SECRET is missing', async () => {
    vi.stubEnv('SESSION_SECRET', '');

    await expect(hasValidSession('token')).rejects.toThrow('SESSION_SECRET');
    expect(jwtVerifyMock).not.toHaveBeenCalled();
  });

  it('rejects a short SESSION_SECRET in production (weak encryption key)', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SESSION_SECRET', 'corto');

    await expect(hasValidSession('token')).rejects.toThrow('al menos 32 caracteres');
  });

  it('only warns about a short SESSION_SECRET outside production', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubEnv('SESSION_SECRET', 'corto');
    jwtVerifyMock.mockResolvedValue({ payload: { userInfo: {} } } as never);

    await expect(hasValidSession('token')).resolves.toBe(true);
    warn.mockRestore();
  });

  it('decrypts with a 256-bit key and only accepts dir + A256GCM', async () => {
    jwtVerifyMock.mockResolvedValue({ payload: { userInfo: {} } } as never);

    await hasValidSession('token');

    const [, key, options] = jwtVerifyMock.mock.calls[0] as unknown as [string, Uint8Array, unknown];
    expect(key).toHaveLength(32);
    expect(options).toEqual({ keyManagementAlgorithms: ['dir'], contentEncryptionAlgorithms: ['A256GCM'] });
  });
});
