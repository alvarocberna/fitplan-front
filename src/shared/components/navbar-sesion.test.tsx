import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NavbarSesion } from './navbar-sesion.component';

const usePathnameMock = vi.fn();
vi.mock('next/navigation', () => ({ usePathname: () => usePathnameMock() }));

describe('NavbarSesion', () => {
  it('renders links to /panel, /perfil and the logout endpoint', () => {
    usePathnameMock.mockReturnValue('/panel');
    render(<NavbarSesion />);

    expect(screen.getByRole('link', { name: 'Panel' })).toHaveAttribute('href', '/panel');
    expect(screen.getByRole('link', { name: 'Perfil' })).toHaveAttribute('href', '/perfil');
    expect(screen.getByRole('link', { name: 'Cerrar sesión' })).toHaveAttribute('href', '/api/cognito/logout');
  });

  it('highlights /panel as active when the current pathname is /panel', () => {
    usePathnameMock.mockReturnValue('/panel');
    render(<NavbarSesion />);

    expect(screen.getByRole('link', { name: 'Panel' })).toHaveStyle({ backgroundColor: 'var(--color-primary)' });
    expect(screen.getByRole('link', { name: 'Perfil' })).not.toHaveStyle({ backgroundColor: 'var(--color-primary)' });
  });

  it('highlights /perfil as active when the current pathname is /perfil', () => {
    usePathnameMock.mockReturnValue('/perfil');
    render(<NavbarSesion />);

    expect(screen.getByRole('link', { name: 'Perfil' })).toHaveStyle({ backgroundColor: 'var(--color-primary)' });
    expect(screen.getByRole('link', { name: 'Panel' })).not.toHaveStyle({ backgroundColor: 'var(--color-primary)' });
  });

  it('highlights no link when the current pathname matches neither', () => {
    usePathnameMock.mockReturnValue('/otra-ruta');
    render(<NavbarSesion />);

    expect(screen.getByRole('link', { name: 'Panel' })).not.toHaveStyle({ backgroundColor: 'var(--color-primary)' });
    expect(screen.getByRole('link', { name: 'Perfil' })).not.toHaveStyle({ backgroundColor: 'var(--color-primary)' });
  });
});
