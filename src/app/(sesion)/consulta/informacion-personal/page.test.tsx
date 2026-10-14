import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import NewPatient from './page';
import { syncProfileAction } from '@/shared/auth/profile.actions';

vi.mock('@/shared/auth/profile.actions', () => ({ syncProfileAction: vi.fn() }));
// el formulario se prueba aparte (form-user-info.test.tsx): acá solo importa a dónde se le dice que siga
vi.mock('@/features', () => ({
  FormUserInfo: ({ nextHref }: { nextHref: string }) => <p data-testid="next-href">{nextHref}</p>,
}));

const mockedSyncProfileAction = vi.mocked(syncProfileAction);

async function renderPage(params: Record<string, string> = {}) {
  const jsx = await NewPatient({ searchParams: Promise.resolve(params) });
  render(jsx);
}

beforeEach(() => {
  mockedSyncProfileAction.mockReset();
  mockedSyncProfileAction.mockResolvedValue({ ok: false, message: 'sin backend' });
});

describe('NewPatient (/consulta/informacion-personal)', () => {
  it('por defecto (dentro de una consulta) sigue a anamnesis', async () => {
    await renderPage();

    expect(screen.getByTestId('next-href')).toHaveTextContent('/consulta/anamnesis');
  });

  it('con ?destino=inicio (login "solo entrar" con perfil incompleto) vuelve a /inicio', async () => {
    await renderPage({ destino: 'inicio' });

    expect(screen.getByTestId('next-href')).toHaveTextContent('/inicio');
  });

  it('ignora un destino fuera de la lista permitida', async () => {
    await renderPage({ destino: 'https://evil.example' });

    expect(screen.getByTestId('next-href')).toHaveTextContent('/consulta/anamnesis');
  });
});
