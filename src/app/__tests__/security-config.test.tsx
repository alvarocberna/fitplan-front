import { describe, it, expect, vi, afterEach } from 'vitest';
import nextConfig from '../../../next.config';
import DevLayout from '@/app/dev/layout';
import { reportClientErrorAction } from '@/shared/errors/report-error.actions';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('security headers (next.config.ts)', () => {
  async function headersFor(nodeEnv: string) {
    vi.stubEnv('NODE_ENV', nodeEnv);
    const [{ source, headers }] = await nextConfig.headers!();
    return { source, headers: Object.fromEntries(headers.map(({ key, value }) => [key, value])) };
  }

  it('applies to every route', async () => {
    expect((await headersFor('production')).source).toBe('/:path*');
  });

  it('sets the baseline headers', async () => {
    const { headers } = await headersFor('production');

    expect(headers).toMatchObject({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '0',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    });
    expect(headers['Permissions-Policy']).toContain('camera=()');
    expect(headers['Permissions-Policy']).toContain('geolocation=()');
  });

  it('only sends HSTS in production', async () => {
    expect((await headersFor('development')).headers).not.toHaveProperty('Strict-Transport-Security');
  });

  it('does not advertise the framework nor ship browser source maps', () => {
    expect(nextConfig.poweredByHeader).toBe(false);
    expect(nextConfig.productionBrowserSourceMaps).toBe(false);
  });
});

describe('/dev/* (herramientas de desarrollo)', () => {
  it('answers 404 in production', () => {
    vi.stubEnv('NODE_ENV', 'production');

    expect(() => DevLayout({ children: null })).toThrow('NEXT_NOT_FOUND');
  });

  it('renders outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');

    expect(() => DevLayout({ children: null })).not.toThrow();
  });
});

describe('reportClientErrorAction (acción pública)', () => {
  it('stops logging past the per-minute cap, so it cannot be used to flood the logs', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    for (let i = 0; i < 100; i++) {
      await reportClientErrorAction({ boundary: 'app', message: 'x' });
    }

    expect(error.mock.calls.length).toBeLessThanOrEqual(30);
    expect(error.mock.calls.length).toBeGreaterThan(0);
  });

  it('truncates oversized fields', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 120_000); // ventana nueva
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    await reportClientErrorAction({ boundary: 'app', message: 'a'.repeat(50_000) });

    expect((error.mock.calls[0][1] as string).length).toBeLessThan(6000);
    vi.useRealTimers();
  });
});
