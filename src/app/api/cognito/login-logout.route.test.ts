import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET as login } from './login/route';
import { GET as logout } from './logout/route';
import { getCognitoConfig } from '@/shared/auth/cognito-config';
import { deleteSession } from '@/shared/auth/session';

vi.mock('openid-client', () => ({
  buildAuthorizationUrl: vi.fn(() => new URL('https://auth.example.com/oauth2/authorize')),
  randomState: () => 'state-1',
  randomNonce: () => 'nonce-1',
}));
vi.mock('@/shared/auth/cognito-config', () => ({ getCognitoConfig: vi.fn() }));
vi.mock('@/shared/auth/session', () => ({ deleteSession: vi.fn() }));

const request = (path: string) => new Request(`http://localhost:3000${path}`);

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.mocked(getCognitoConfig).mockReset().mockResolvedValue({} as never);
  vi.mocked(deleteSession).mockReset();
  vi.stubEnv('COGNITO_REDIRECT_URI', 'http://localhost:3000/api/cognito/callback');
  vi.stubEnv('COGNITO_DOMAIN', 'https://auth.example.com');
  vi.stubEnv('COGNITO_CLIENT_ID', 'client-1');
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  consoleError.mockRestore();
});

describe('GET /api/cognito/login', () => {
  it('redirects to the Cognito authorization URL', async () => {
    const response = await login(request('/api/cognito/login'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://auth.example.com/oauth2/authorize');
  });

  it('redirects to /login with an error (instead of a raw 500) when Cognito discovery fails', async () => {
    vi.mocked(getCognitoConfig).mockRejectedValue(new Error('ECONNREFUSED'));

    const response = await login(request('/api/cognito/login'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/login?error=login_unavailable');
    expect(consoleError).toHaveBeenCalled();
  });

  it('redirects to /login with an error when COGNITO_REDIRECT_URI is missing', async () => {
    vi.stubEnv('COGNITO_REDIRECT_URI', '');

    const response = await login(request('/api/cognito/login'));

    expect(response.headers.get('location')).toBe('http://localhost:3000/login?error=login_unavailable');
    expect(getCognitoConfig).not.toHaveBeenCalled();
  });
});

describe('GET /api/cognito/logout', () => {
  it('deletes the session and redirects to the Cognito logout', async () => {
    const response = await logout(request('/api/cognito/logout'));

    expect(deleteSession).toHaveBeenCalled();
    expect(response.headers.get('location')).toContain('https://auth.example.com/logout?client_id=client-1');
  });

  it('still deletes the local session and goes home when the Cognito config is missing', async () => {
    vi.stubEnv('COGNITO_DOMAIN', '');

    const response = await logout(request('/api/cognito/logout'));

    expect(deleteSession).toHaveBeenCalled();
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/');
  });
});
