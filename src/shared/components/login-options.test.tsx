import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoginOptions } from './login-options.component';

describe('LoginOptions', () => {
  it('sin returnTo: enlaces al login de Cognito para Google, registro e inicio de sesión', () => {
    render(<LoginOptions />);

    expect(screen.getByRole('link', { name: /Continuar con Google/ })).toHaveAttribute(
      'href',
      '/api/cognito/login?identity_provider=Google'
    );
    expect(screen.getByRole('link', { name: 'Registro' })).toHaveAttribute(
      'href',
      '/api/cognito/login?screen_hint=signup'
    );
    expect(screen.getByRole('link', { name: 'Inicio de sesión' })).toHaveAttribute('href', '/api/cognito/login');
  });

  it('con returnTo: lo agrega como return_to (codificado) en los tres enlaces', () => {
    render(<LoginOptions returnTo="/carrito" />);

    expect(screen.getByRole('link', { name: /Continuar con Google/ })).toHaveAttribute(
      'href',
      '/api/cognito/login?identity_provider=Google&return_to=%2Fcarrito'
    );
    expect(screen.getByRole('link', { name: 'Registro' })).toHaveAttribute(
      'href',
      '/api/cognito/login?screen_hint=signup&return_to=%2Fcarrito'
    );
    expect(screen.getByRole('link', { name: 'Inicio de sesión' })).toHaveAttribute(
      'href',
      '/api/cognito/login?return_to=%2Fcarrito'
    );
  });
});
