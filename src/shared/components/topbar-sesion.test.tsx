import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { TopbarSesion } from './topbar-sesion.component';

const usePathnameMock = vi.fn();
vi.mock('next/navigation', () => ({ usePathname: () => usePathnameMock() }));

// jsdom no aplica CSS: los enlaces del menú móvil (md:hidden) están en el DOM junto al resto.
const mobileNav = () => screen.getByRole('navigation', { name: 'Menú de usuario' });

describe('TopbarSesion', () => {
  it('renders a fixed full-width header of h-15', () => {
    usePathnameMock.mockReturnValue('/panel');
    render(<TopbarSesion />);

    expect(screen.getByRole('banner')).toHaveClass('fixed', 'top-0', 'w-full', 'h-15');
  });

  it('links the "Nuvi" logo to the site root', () => {
    usePathnameMock.mockReturnValue('/panel');
    render(<TopbarSesion />);

    expect(screen.getByRole('link', { name: 'Nuvi' })).toHaveAttribute('href', '/');
  });

  it('renders the "Nueva consulta" button pointing to /consulta/anamnesis, outside the mobile menu', () => {
    usePathnameMock.mockReturnValue('/panel');
    render(<TopbarSesion />);

    const button = screen.getByRole('link', { name: 'Nueva consulta' });
    expect(button).toHaveAttribute('href', '/consulta/anamnesis');
    expect(mobileNav()).not.toContainElement(button);
  });

  it('keeps "Nueva consulta" visible on every route (never hidden by the collapse or active state)', () => {
    for (const path of ['/panel', '/perfil', '/consulta/anamnesis', '/pago/abc']) {
      usePathnameMock.mockReturnValue(path);
      const { unmount } = render(<TopbarSesion />);

      const button = screen.getByRole('link', { name: 'Nueva consulta' });
      expect(button).not.toHaveClass('hidden');
      expect(button).not.toHaveClass('md:hidden');
      unmount();
    }
  });

  describe('menú de usuario (móvil)', () => {
    it('is a flex md:hidden nav, so it only shows on small screens', () => {
      usePathnameMock.mockReturnValue('/panel');
      render(<TopbarSesion />);

      expect(mobileNav()).toHaveClass('flex', 'md:hidden');
    });

    it('lists Perfil, Home and Cerrar sesión, in that order, with the right hrefs', () => {
      usePathnameMock.mockReturnValue('/panel');
      render(<TopbarSesion />);

      const links = within(mobileNav()).getAllByRole('link');
      expect(links.map((link) => link.textContent)).toEqual(['Perfil', 'Home', 'Cerrar sesión']);
      expect(links.map((link) => link.getAttribute('href'))).toEqual(['/perfil', '/panel', '/api/cognito/logout']);
    });

    it('highlights the link matching the pathname with the primary color (Home on /panel)', () => {
      usePathnameMock.mockReturnValue('/panel');
      render(<TopbarSesion />);

      const nav = within(mobileNav());
      expect(nav.getByRole('link', { name: 'Home' })).toHaveStyle({ color: 'var(--color-primary)' });
      expect(nav.getByRole('link', { name: 'Perfil' })).not.toHaveStyle({ color: 'var(--color-primary)' });
      expect(nav.getByRole('link', { name: 'Cerrar sesión' })).not.toHaveStyle({ color: 'var(--color-primary)' });
    });

    it('highlights Perfil on /perfil', () => {
      usePathnameMock.mockReturnValue('/perfil');
      render(<TopbarSesion />);

      const nav = within(mobileNav());
      expect(nav.getByRole('link', { name: 'Perfil' })).toHaveStyle({ color: 'var(--color-primary)' });
      expect(nav.getByRole('link', { name: 'Home' })).not.toHaveStyle({ color: 'var(--color-primary)' });
    });

    it('highlights nothing on routes that are not in the menu', () => {
      usePathnameMock.mockReturnValue('/consulta/anamnesis');
      render(<TopbarSesion />);

      for (const link of within(mobileNav()).getAllByRole('link')) {
        expect(link).not.toHaveStyle({ color: 'var(--color-primary)' });
      }
    });

    it('never renders the side rectangle (compact variant), even for the active link', () => {
      usePathnameMock.mockReturnValue('/panel');
      render(<TopbarSesion />);

      expect(screen.queryByTestId('nav-active-indicator')).not.toBeInTheDocument();
    });
  });
});
