import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ConsultaLogin from './page';

async function renderPage(params: Record<string, string> = {}) {
  const jsx = await ConsultaLogin({ searchParams: Promise.resolve(params) });
  render(jsx);
}

describe('ConsultaLogin (/login)', () => {
  it('sin return_to ("Iniciar sesión"): las opciones de login no llevan destino', async () => {
    await renderPage();

    expect(screen.getByRole('link', { name: /Continuar con Google/ })).toHaveAttribute(
      'href',
      '/api/cognito/login?identity_provider=Google',
    );
  });

  it('con return_to=/consulta/inicio ("Iniciar Consulta"): lo reenvía a las opciones de login', async () => {
    await renderPage({ return_to: '/consulta/inicio' });

    expect(screen.getByRole('link', { name: /Continuar con Google/ })).toHaveAttribute(
      'href',
      '/api/cognito/login?identity_provider=Google&return_to=%2Fconsulta%2Finicio',
    );
    expect(screen.getByRole('link', { name: 'Registro' })).toHaveAttribute(
      'href',
      '/api/cognito/login?screen_hint=signup&return_to=%2Fconsulta%2Finicio',
    );
  });

  it('descarta un return_to fuera de la lista permitida', async () => {
    await renderPage({ return_to: 'https://evil.example' });

    expect(screen.getByRole('link', { name: /Continuar con Google/ })).toHaveAttribute(
      'href',
      '/api/cognito/login?identity_provider=Google',
    );
  });
});
