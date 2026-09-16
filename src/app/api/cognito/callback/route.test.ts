import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { authorizationCodeGrant, fetchUserInfo } from 'openid-client';
import { getCognitoConfig } from '@/shared/auth/cognito-config';
import { createSession } from '@/shared/auth/session';
import { apiFetch } from '@/shared/api/client';

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn(),
    delete: vi.fn(),
  })),
}));

vi.mock('openid-client', () => ({
  authorizationCodeGrant: vi.fn(),
  fetchUserInfo: vi.fn(),
}));

vi.mock('@/shared/auth/cognito-config', () => ({
  getCognitoConfig: vi.fn(),
}));

vi.mock('@/shared/auth/session', () => ({
  createSession: vi.fn(),
}));

vi.mock('@/shared/api/client', () => ({
  apiFetch: vi.fn(),
}));

const mockedAuthorizationCodeGrant = vi.mocked(authorizationCodeGrant);
const mockedFetchUserInfo = vi.mocked(fetchUserInfo);
const mockedGetCognitoConfig = vi.mocked(getCognitoConfig);
const mockedCreateSession = vi.mocked(createSession);
const mockedApiFetch = vi.mocked(apiFetch);

// Fake mínimo de lo que openid-client's authorizationCodeGrant devuelve, solo con lo que
// route.ts realmente lee (claims(), access_token, refresh_token, expiresIn()).
function makeTokens(overrides: Record<string, unknown> = {}) {
  return {
    claims: () => ({ sub: 'sub-123' }),
    access_token: 'token-abc',
    refresh_token: 'refresh-abc',
    expiresIn: () => 3600,
    ...overrides,
  };
}

function makeRequest() {
  return new Request('http://localhost:3000/api/cognito/callback?code=abc&state=xyz');
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedGetCognitoConfig.mockResolvedValue({} as never);
});

describe('GET /api/cognito/callback', () => {
  it('redirects to /login?error=callback_failed when the token exchange fails', async () => {
    mockedAuthorizationCodeGrant.mockRejectedValue(new Error('boom'));

    const response = await GET(makeRequest());

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/login?error=callback_failed');
    expect(mockedCreateSession).not.toHaveBeenCalled();
    expect(mockedApiFetch).not.toHaveBeenCalled();
  });

  it('redirects to /login?error=callback_failed when the id_token has no "sub" claim', async () => {
    mockedAuthorizationCodeGrant.mockResolvedValue(makeTokens({ claims: () => ({}) }) as never);

    const response = await GET(makeRequest());

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/login?error=callback_failed');
    expect(mockedCreateSession).not.toHaveBeenCalled();
    expect(mockedApiFetch).not.toHaveBeenCalled();
  });

  it('redirects to /panel when the profile check confirms the profile is already complete', async () => {
    mockedAuthorizationCodeGrant.mockResolvedValue(makeTokens() as never);
    mockedFetchUserInfo.mockResolvedValue({ sub: 'sub-123', email: 'user@test.com' } as never);
    mockedApiFetch.mockResolvedValue({ profileComplete: true } as never);

    const response = await GET(makeRequest());

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/panel');
    expect(mockedCreateSession).toHaveBeenCalledTimes(1);
  });

  it('redirects to /consulta/inicio when the profile check confirms the profile is incomplete', async () => {
    mockedAuthorizationCodeGrant.mockResolvedValue(makeTokens() as never);
    mockedFetchUserInfo.mockResolvedValue({ sub: 'sub-123', email: 'user@test.com' } as never);
    mockedApiFetch.mockResolvedValue({ profileComplete: false } as never);

    const response = await GET(makeRequest());

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/consulta/inicio');
  });

  it('redirects to /consulta/inicio (fail-safe) when the profile check itself fails, but still creates the session', async () => {
    mockedAuthorizationCodeGrant.mockResolvedValue(makeTokens() as never);
    mockedFetchUserInfo.mockResolvedValue({ sub: 'sub-123', email: 'user@test.com' } as never);
    mockedApiFetch.mockRejectedValue(new Error('backend caido'));

    const response = await GET(makeRequest());

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/consulta/inicio');
    expect(mockedCreateSession).toHaveBeenCalledTimes(1);
  });

  it('calls apiFetch with the email from fetchUserInfo and the access token from the token exchange (no la cookie de sesión recién escrita)', async () => {
    mockedAuthorizationCodeGrant.mockResolvedValue(makeTokens({ access_token: 'token-xyz' }) as never);
    mockedFetchUserInfo.mockResolvedValue({ sub: 'sub-123', email: 'user@test.com' } as never);
    mockedApiFetch.mockResolvedValue({ profileComplete: false } as never);

    await GET(makeRequest());

    expect(mockedApiFetch).toHaveBeenCalledWith(
      'auth/perfil',
      'POST',
      { email: 'user@test.com' },
      'token-xyz',
    );
  });
});
