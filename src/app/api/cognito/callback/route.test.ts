import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from './route';
import { cookies } from 'next/headers';
import { authorizationCodeGrant, fetchUserInfo } from 'openid-client';
import { getCognitoConfig } from '@/shared/auth/cognito-config';
import { createSession, deleteSession } from '@/shared/auth/session';
import { apiFetch, ApiError } from '@/shared/api/client';

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
  deleteSession: vi.fn(),
}));

vi.mock('@/shared/api/client', () => ({
  apiFetch: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(message: string, public status: number, public code?: string) {
      super(message);
    }
  },
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

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('GET /api/cognito/callback', () => {
  it('exchanges the code using the public callback URL (COGNITO_REDIRECT_URI), not the internal request URL', async () => {
    // detrás del hosting el handler ve https://localhost:3000/...; el redirect_uri debe ser el registrado
    vi.stubEnv('COGNITO_REDIRECT_URI', 'https://app.fitplan.cl/api/cognito/callback');
    mockedAuthorizationCodeGrant.mockResolvedValue(makeTokens() as never);
    mockedFetchUserInfo.mockResolvedValue({ sub: 'sub-123' } as never);
    mockedApiFetch.mockResolvedValue({ profileComplete: true });

    await GET(makeRequest());

    const currentUrl = mockedAuthorizationCodeGrant.mock.calls[0][1] as URL;
    expect(currentUrl.toString()).toBe('https://app.fitplan.cl/api/cognito/callback?code=abc&state=xyz');
  });

  it('redirects to /login?error=callback_failed when the token exchange fails', async () => {
    mockedAuthorizationCodeGrant.mockRejectedValue(new Error('boom'));

    const response = await GET(makeRequest());

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('/login?error=callback_failed');
    expect(mockedCreateSession).not.toHaveBeenCalled();
    expect(mockedApiFetch).not.toHaveBeenCalled();
  });

  it('redirects to /login?error=callback_failed when the id_token has no "sub" claim', async () => {
    mockedAuthorizationCodeGrant.mockResolvedValue(makeTokens({ claims: () => ({}) }) as never);

    const response = await GET(makeRequest());

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('/login?error=callback_failed');
    expect(mockedCreateSession).not.toHaveBeenCalled();
    expect(mockedApiFetch).not.toHaveBeenCalled();
  });

  it('redirects to /inicio when the profile check confirms the profile is already complete', async () => {
    mockedAuthorizationCodeGrant.mockResolvedValue(makeTokens() as never);
    mockedFetchUserInfo.mockResolvedValue({ sub: 'sub-123', email: 'user@test.com' } as never);
    mockedApiFetch.mockResolvedValue({ profileComplete: true } as never);

    const response = await GET(makeRequest());

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('/inicio');
    expect(mockedCreateSession).toHaveBeenCalledTimes(1);
  });

  it('redirects to /consulta/inicio when the profile check confirms the profile is incomplete', async () => {
    mockedAuthorizationCodeGrant.mockResolvedValue(makeTokens() as never);
    mockedFetchUserInfo.mockResolvedValue({ sub: 'sub-123', email: 'user@test.com' } as never);
    mockedApiFetch.mockResolvedValue({ profileComplete: false } as never);

    const response = await GET(makeRequest());

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('/consulta/inicio');
  });

  it('redirects to /consulta/inicio (fail-safe) when the profile check itself fails, but still creates the session', async () => {
    mockedAuthorizationCodeGrant.mockResolvedValue(makeTokens() as never);
    mockedFetchUserInfo.mockResolvedValue({ sub: 'sub-123', email: 'user@test.com' } as never);
    mockedApiFetch.mockRejectedValue(new Error('backend caido'));

    const response = await GET(makeRequest());

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('/consulta/inicio');
    expect(mockedCreateSession).toHaveBeenCalledTimes(1);
  });

  it('vuelve a /carrito (y no a /inicio) si el login se inició con return_to=/carrito, sin saltarse el chequeo de perfil', async () => {
    const cookieStore = {
      get: vi.fn((name: string) => (name === 'post_login_return_to' ? { value: '/carrito' } : undefined)),
      delete: vi.fn(),
    };
    vi.mocked(cookies).mockResolvedValueOnce(cookieStore as never);
    mockedAuthorizationCodeGrant.mockResolvedValue(makeTokens() as never);
    mockedFetchUserInfo.mockResolvedValue({ sub: 'sub-123', email: 'user@test.com' } as never);
    mockedApiFetch.mockResolvedValue({ profileComplete: true } as never);

    const response = await GET(makeRequest());

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('/carrito');
    // el chequeo crea la identidad que el backend necesita para crear la orden
    expect(mockedApiFetch).toHaveBeenCalledWith('me/sync', 'POST', undefined, 'token-abc');
    expect(cookieStore.delete).toHaveBeenCalledWith('post_login_return_to');
  });

  it('ignora un return_to fuera de la lista permitida y usa el destino por defecto', async () => {
    const cookieStore = {
      get: vi.fn((name: string) => (name === 'post_login_return_to' ? { value: 'https://evil.example' } : undefined)),
      delete: vi.fn(),
    };
    vi.mocked(cookies).mockResolvedValueOnce(cookieStore as never);
    mockedAuthorizationCodeGrant.mockResolvedValue(makeTokens() as never);
    mockedFetchUserInfo.mockResolvedValue({ sub: 'sub-123', email: 'user@test.com' } as never);
    mockedApiFetch.mockResolvedValue({ profileComplete: true } as never);

    const response = await GET(makeRequest());

    expect(response.headers.get('location')).toBe('/inicio');
  });

  it('calls me/sync WITHOUT an email (the backend asks Cognito for it) and with the access token from the token exchange', async () => {
    mockedAuthorizationCodeGrant.mockResolvedValue(makeTokens({ access_token: 'token-xyz' }) as never);
    mockedFetchUserInfo.mockResolvedValue({ sub: 'sub-123', email: 'user@test.com' } as never);
    mockedApiFetch.mockResolvedValue({ profileComplete: false } as never);

    await GET(makeRequest());

    expect(mockedApiFetch).toHaveBeenCalledWith('me/sync', 'POST', undefined, 'token-xyz');
  });

  it('discards the session and sends to /login?error=email_not_verified when the account email is not verified', async () => {
    mockedAuthorizationCodeGrant.mockResolvedValue(makeTokens() as never);
    mockedFetchUserInfo.mockResolvedValue({ sub: 'sub-123', email: 'user@test.com' } as never);
    mockedApiFetch.mockRejectedValue(new ApiError('Verifica tu correo', 403, 'EMAIL_NOT_VERIFIED'));

    const response = await GET(makeRequest());

    expect(vi.mocked(deleteSession)).toHaveBeenCalled();
    expect(response.headers.get('location')).toBe('/login?error=email_not_verified');
  });
});
