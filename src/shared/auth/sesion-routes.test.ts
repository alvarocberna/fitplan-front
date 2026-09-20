import { describe, it, expect } from 'vitest';
import { SESION_PATHS, isSesionRoute, isFocusRoute, usesSesionLayout } from './sesion-routes';

describe('isSesionRoute', () => {
  it.each(['/panel', '/perfil'])('is true for %s', (pathname) => {
    expect(isSesionRoute(pathname)).toBe(true);
  });

  it.each(['/', '/consulta/inicio', '/ordenes/abc', '/panel/', '/panel/sub', '/perfilx', '/dev'])(
    'is false for %s (exact match only, used by the proxy)',
    (pathname) => {
      expect(isSesionRoute(pathname)).toBe(false);
    },
  );

  it('exposes exactly /panel and /perfil in SESION_PATHS', () => {
    expect([...SESION_PATHS].sort()).toEqual(['/panel', '/perfil']);
  });
});

describe('isFocusRoute', () => {
  it.each([
    '/consulta',
    '/consulta/inicio',
    '/consulta/informacion-personal',
    '/consulta/anamnesis',
    '/ordenes',
    '/ordenes/abc-123',
  ])('is true for %s', (pathname) => {
    expect(isFocusRoute(pathname)).toBe(true);
  });

  it.each(['/', '/panel', '/perfil', '/dev', '/articulos', '/pago/abc', '/consultas', '/consulta-x', '/ordenesx'])(
    'is false for %s',
    (pathname) => {
      expect(isFocusRoute(pathname)).toBe(false);
    },
  );
});

describe('usesSesionLayout', () => {
  it.each(['/panel', '/perfil', '/consulta', '/consulta/inicio', '/consulta/anamnesis', '/ordenes/abc-123'])(
    'is true for %s',
    (pathname) => {
      expect(usesSesionLayout(pathname)).toBe(true);
    },
  );

  it.each(['/', '/articulos', '/login', '/pago/abc', '/dev', '/consultas'])('is false for %s', (pathname) => {
    expect(usesSesionLayout(pathname)).toBe(false);
  });
});
