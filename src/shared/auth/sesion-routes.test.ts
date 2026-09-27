import { describe, it, expect } from 'vitest';
import { SESION_PATHS, isSesionRoute, isSessionGatedPrefix, isFocusRoute, usesSesionLayout } from './sesion-routes';

describe('isSesionRoute', () => {
  it.each(['/panel', '/perfil', '/panel/consultas/abc-123', '/perfil/sub'])('is true for %s (raíz y subrutas)', (pathname) => {
    expect(isSesionRoute(pathname)).toBe(true);
  });

  it.each(['/', '/consulta/inicio', '/ordenes/abc', '/pago/abc', '/panelx', '/perfilx', '/dev'])(
    'is false for %s',
    (pathname) => {
      expect(isSesionRoute(pathname)).toBe(false);
    },
  );

  it('exposes exactly /panel and /perfil in SESION_PATHS', () => {
    expect([...SESION_PATHS].sort()).toEqual(['/panel', '/perfil']);
  });
});

describe('isSessionGatedPrefix', () => {
  it.each(['/pago', '/pago/abc', '/ordenes', '/ordenes/abc'])('is true for %s (raíz y subrutas)', (pathname) => {
    expect(isSessionGatedPrefix(pathname)).toBe(true);
  });

  it.each(['/', '/consulta', '/consulta/inicio', '/panel', '/pagos', '/pago-x', '/ordenesx'])(
    'is false for %s',
    (pathname) => {
      expect(isSessionGatedPrefix(pathname)).toBe(false);
    },
  );
});

describe('isFocusRoute', () => {
  it.each([
    '/consulta',
    '/consulta/inicio',
    '/consulta/informacion-personal',
    '/consulta/anamnesis',
    '/pago',
    '/pago/abc',
    '/ordenes',
    '/ordenes/abc-123',
  ])('is true for %s', (pathname) => {
    expect(isFocusRoute(pathname)).toBe(true);
  });

  it.each(['/', '/panel', '/perfil', '/dev', '/articulos', '/consultas', '/consulta-x', '/pagos', '/ordenesx'])(
    'is false for %s',
    (pathname) => {
      expect(isFocusRoute(pathname)).toBe(false);
    },
  );
});

describe('usesSesionLayout', () => {
  it.each(['/panel', '/panel/consultas/abc-123', '/perfil', '/consulta', '/consulta/inicio', '/consulta/anamnesis', '/pago/abc', '/ordenes/abc-123'])(
    'is true for %s',
    (pathname) => {
      expect(usesSesionLayout(pathname)).toBe(true);
    },
  );

  it.each(['/', '/articulos', '/login', '/dev', '/consultas'])('is false for %s', (pathname) => {
    expect(usesSesionLayout(pathname)).toBe(false);
  });
});
