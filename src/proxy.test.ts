import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from '@/proxy';
import { hasValidSession } from '@/shared/auth/session';

vi.mock('@/shared/auth/session', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/auth/session')>();
  return { ...actual, hasValidSession: vi.fn() };
});

const hasValidSessionMock = vi.mocked(hasValidSession);

function makeRequest(pathname: string, cookieValue?: string) {
  const headers: Record<string, string> = cookieValue ? { cookie: `session=${cookieValue}` } : {};
  return new NextRequest(`http://localhost:3000${pathname}`, { headers });
}

beforeEach(() => {
  hasValidSessionMock.mockReset();
});

describe('proxy — session gating', () => {
  describe('/home (PROTECTED_PATHS, fuera de /consulta/*)', () => {
    it('redirects to /login when there is no session cookie at all', async () => {
      const response = await proxy(makeRequest('/home'));

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login');
      expect(hasValidSessionMock).not.toHaveBeenCalled();
    });

    it('redirects to /login when the session cookie is present but invalid/expired', async () => {
      hasValidSessionMock.mockResolvedValue(false);

      const response = await proxy(makeRequest('/home', 'invalid-token'));

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('lets the request through when the session cookie is valid', async () => {
      hasValidSessionMock.mockResolvedValue(true);

      const response = await proxy(makeRequest('/home', 'valid-token'));

      expect(response.headers.get('location')).toBeNull();
    });
  });

  describe('/panel (PROTECTED_PATHS, fuera de /consulta/*)', () => {
    it('redirects to /login when there is no session cookie at all', async () => {
      const response = await proxy(makeRequest('/panel'));

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login');
      expect(hasValidSessionMock).not.toHaveBeenCalled();
    });

    it('redirects to /login when the session cookie is present but invalid/expired', async () => {
      hasValidSessionMock.mockResolvedValue(false);

      const response = await proxy(makeRequest('/panel', 'invalid-token'));

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('lets the request through when the session cookie is valid', async () => {
      hasValidSessionMock.mockResolvedValue(true);

      const response = await proxy(makeRequest('/panel', 'valid-token'));

      expect(response.headers.get('location')).toBeNull();
    });
  });

  describe('/perfil (PROTECTED_PATHS, fuera de /consulta/*)', () => {
    it('redirects to /login when there is no session cookie at all', async () => {
      const response = await proxy(makeRequest('/perfil'));

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login');
      expect(hasValidSessionMock).not.toHaveBeenCalled();
    });

    it('redirects to /login when the session cookie is present but invalid/expired', async () => {
      hasValidSessionMock.mockResolvedValue(false);

      const response = await proxy(makeRequest('/perfil', 'invalid-token'));

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('lets the request through when the session cookie is valid', async () => {
      hasValidSessionMock.mockResolvedValue(true);

      const response = await proxy(makeRequest('/perfil', 'valid-token'));

      expect(response.headers.get('location')).toBeNull();
    });
  });

  describe('/consulta/* (todo protegido salvo /consulta, que sigue siendo pública)', () => {
    it('redirects /consulta/inicio to /login without a session (ya no es una ruta pública)', async () => {
      const response = await proxy(makeRequest('/consulta/inicio'));

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('lets /consulta/inicio through with a valid session', async () => {
      hasValidSessionMock.mockResolvedValue(true);

      const response = await proxy(makeRequest('/consulta/inicio', 'valid-token'));

      expect(response.headers.get('location')).toBeNull();
    });

    it('redirects a protected /consulta/* route (e.g. /consulta/anamnesis) to /login without a session', async () => {
      const response = await proxy(makeRequest('/consulta/anamnesis'));

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('lets a protected /consulta/* route through with a valid session', async () => {
      hasValidSessionMock.mockResolvedValue(true);

      const response = await proxy(makeRequest('/consulta/anamnesis', 'valid-token'));

      expect(response.headers.get('location')).toBeNull();
    });

    it('lets /consulta through without a session (única ruta pública bajo /consulta/*)', async () => {
      const response = await proxy(makeRequest('/consulta'));

      expect(response.headers.get('location')).toBeNull();
      expect(hasValidSessionMock).not.toHaveBeenCalled();
    });
  });

  describe('rutas sin gating', () => {
    it('lets an unrelated public route (e.g. /) through without checking the session', async () => {
      const response = await proxy(makeRequest('/'));

      expect(response.headers.get('location')).toBeNull();
      expect(hasValidSessionMock).not.toHaveBeenCalled();
    });
  });
});
