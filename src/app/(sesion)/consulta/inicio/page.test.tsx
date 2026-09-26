import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import StartConsultation from './page';
import { getSession } from '@/shared/auth/session';
import { syncProfileAction } from '@/shared/auth/profile.actions';
import type { PerfilStatus } from '@/shared/auth/profile.actions';

vi.mock('@/shared/auth/session', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/auth/session')>();
  return { ...actual, getSession: vi.fn() };
});
vi.mock('@/shared/auth/profile.actions', () => ({ syncProfileAction: vi.fn() }));

const mockedGetSession = vi.mocked(getSession);
const mockedSyncProfileAction = vi.mocked(syncProfileAction);

// StartConsultation es un Server Component async: no se puede montar directo con render()
// como un Client Component, pero al ser solo una función async que devuelve JSX, alcanza con
// esperar su resolución antes de pasársela a render() (mismo enfoque que RTL recomienda para
// Server Components en Next.js App Router).
async function renderPage() {
  const jsx = await StartConsultation();
  render(jsx);
}

function profile(overrides: Partial<PerfilStatus> = {}): PerfilStatus {
  return {
    profileComplete: true,
    firstName: null,
    middleName: null,
    paternalLastName: null,
    maternalLastName: null,
    gender: null,
    dateOfBirth: null,
    athlete: false,
    email: null,
    rut: null,
    rutCheckDigit: null,
    ...overrides,
  };
}

beforeEach(() => {
  mockedGetSession.mockReset();
  mockedSyncProfileAction.mockReset();
});

describe('StartConsultation (/consulta/inicio)', () => {
  it('points "Iniciar" to /login when there is no session', async () => {
    mockedGetSession.mockResolvedValue({ isAuthenticated: false, status: 'anonymous', userInfo: null });

    await renderPage();

    expect(screen.getByRole('link', { name: 'Iniciar' })).toHaveAttribute('href', '/login');
    expect(mockedSyncProfileAction).not.toHaveBeenCalled();
  });

  it('points "Iniciar" to /consulta/informacion-personal when authenticated but the profile is incomplete', async () => {
    mockedGetSession.mockResolvedValue({ isAuthenticated: true, status: 'authenticated', userInfo: {} });
    mockedSyncProfileAction.mockResolvedValue({ ok: true, data: profile({ profileComplete: false }) });

    await renderPage();

    expect(screen.getByRole('link', { name: 'Iniciar' })).toHaveAttribute('href', '/consulta/informacion-personal');
  });

  it('points "Iniciar" to /panel when authenticated and the profile is already complete', async () => {
    mockedGetSession.mockResolvedValue({ isAuthenticated: true, status: 'authenticated', userInfo: {} });
    mockedSyncProfileAction.mockResolvedValue({ ok: true, data: profile({ profileComplete: true }) });

    await renderPage();

    expect(screen.getByRole('link', { name: 'Iniciar' })).toHaveAttribute('href', '/panel');
  });

  it('falls back to /consulta/informacion-personal (never /panel) when syncProfileAction fails', async () => {
    mockedGetSession.mockResolvedValue({ isAuthenticated: true, status: 'authenticated', userInfo: {} });
    mockedSyncProfileAction.mockResolvedValue({ ok: false, message: 'Token inválido' });

    await renderPage();

    expect(screen.getByRole('link', { name: 'Iniciar' })).toHaveAttribute('href', '/consulta/informacion-personal');
  });
});
