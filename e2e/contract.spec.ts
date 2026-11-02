import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { checkRequest, contractOperations } from './fake-backend/contract.mjs';

const SRC = path.resolve(__dirname, '../src');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [full] : [];
  });
}

// Cada llamada a apiFetch del frontend: apiFetch<T>('ruta', 'METODO', ...). Sin método es GET.
function frontendCalls(): { method: string; path: string; file: string }[] {
  const call = /apiFetch(?:<[^(]*>)?\(\s*[`']([^`']+)[`'](?:\s*,\s*'([A-Z]+)')?/g;
  return sourceFiles(SRC).flatMap((file) =>
    [...readFileSync(file, 'utf8').matchAll(call)].map((match) => ({
      method: match[2] ?? 'GET',
      // un parámetro interpolado (${uuidParam(id)}, ${encodeURIComponent(code)}) se prueba con un UUID v4
      path: `/${match[1]}`.replace(/\$\{[^}]+\}/g, 'aaaaaaaa-0000-4000-8000-000000000000'),
      file: path.relative(SRC, file),
    })),
  );
}

// No usan navegador: comprueban el frontend y el backend falso contra el contrato exportado del backend real.
test.describe('Contrato con el backend', () => {
  test('el frontend solo llama a rutas que existen en el backend real', () => {
    const calls = frontendCalls();
    // red de seguridad: si la expresión deja de reconocer las llamadas, este test no probaría nada
    expect(calls.length).toBeGreaterThan(20);

    const missing = calls.filter((c) => {
      // el método puede venir en otra línea, pero el contrato siempre debe conocer la ruta con ese método
      const { violation } = checkRequest(c.method, c.path, undefined);
      return violation?.kind === 'route-not-in-contract';
    });
    expect(missing).toEqual([]);
  });

  test('rechaza lo mismo que el ValidationPipe del backend real', () => {
    const profile = (body: unknown) => checkRequest('PATCH', '/me', body).violation?.kind;
    expect(profile({ firstName: 'Ana' })).toBeUndefined();
    expect(profile({ firstName: 'Ana', sportLevel: 'none' })).toBe('invalid-body'); // forbidNonWhitelisted
    expect(profile({ firstName: 'x'.repeat(101) })).toBe('invalid-body'); // @MaxLength
    expect(profile({ athlete: 'tal vez' })).toBe('invalid-body'); // @IsBoolean

    const personalInfo = { firstName: 'Ana', paternalLastName: 'Pérez', gender: 'FEMENINO', athlete: false, dateOfBirth: '1990-05-20' };
    const measurements = { weight: 65, height: 165, somatotype: null };
    const anamnesis = { goals: null, clinical: null, dietary: null, lifestyle: null };
    expect(checkRequest('POST', '/consultations', { personalInfo, anamnesis, measurements }).violation).toBeUndefined();
    // @IsOptional admite null; un @IsNumber sin él, no
    expect(checkRequest('POST', '/consultations', { personalInfo, anamnesis, measurements: { ...measurements, weight: null } }).violation?.kind).toBe('invalid-body');
    expect(checkRequest('POST', '/consultations', { anamnesis, measurements }).violation?.kind).toBe('invalid-body');
  });

  test('rechaza ids que no son UUID v4 y rutas inexistentes', () => {
    expect(checkRequest('GET', '/orders/aaaaaaaa-0000-4000-8000-000000000123/status').violation).toBeUndefined();
    expect(checkRequest('GET', '/orders/order-1/status').violation?.kind).toBe('invalid-path-param');
    expect(checkRequest('GET', '/plans/standard/plan-gimnasio-volumen-50-60-m-joven').violation).toBeUndefined();
    expect(checkRequest('GET', '/no-existe').violation?.kind).toBe('route-not-in-contract');
    expect(checkRequest('DELETE', '/me').violation?.kind).toBe('route-not-in-contract');
  });

  test('el contrato incluye las rutas de las que depende el flujo de compra', () => {
    const operations = contractOperations().map((o: { method: string; template: string }) => `${o.method} ${o.template}`);
    expect(operations).toEqual(
      expect.arrayContaining([
        'POST /consultations',
        'POST /orders/{id}/payments',
        'POST /payments/webpay/commit',
        'GET /orders/{id}/status',
        'POST /plans/standard/{code}/purchase',
      ]),
    );
  });
});
