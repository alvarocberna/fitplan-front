import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TopbarSesion } from './topbar-sesion.component';

const usePathnameMock = vi.fn();
vi.mock('next/navigation', () => ({ usePathname: () => usePathnameMock() }));

describe('TopbarSesion', () => {
  it('renders a fixed full-width header of h-15', () => {
    usePathnameMock.mockReturnValue('/inicio');
    render(<TopbarSesion />);

    expect(screen.getByRole('banner')).toHaveClass('fixed', 'top-0', 'w-full', 'h-15');
  });

  it('links the "Nuvi" logo to /inicio', () => {
    usePathnameMock.mockReturnValue('/inicio');
    render(<TopbarSesion />);

    expect(screen.getByRole('link', { name: 'Nuvi' })).toHaveAttribute('href', '/inicio');
  });

  it('renders the "Nueva consulta" button pointing to /consulta/anamnesis', () => {
    usePathnameMock.mockReturnValue('/inicio');
    render(<TopbarSesion />);

    expect(screen.getByRole('link', { name: 'Nueva consulta' })).toHaveAttribute('href', '/consulta/anamnesis');
  });

  it('no longer hosts the session links: they live in the navigation panel (NavbarSesion)', () => {
    usePathnameMock.mockReturnValue('/inicio');
    render(<TopbarSesion onMenuToggle={vi.fn()} />);

    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual(['Nuvi', 'Nueva consulta']);
  });

  it('keeps "Nueva consulta" visible on every route (never hidden by the collapse or active state)', () => {
    for (const path of ['/inicio', '/perfil', '/consulta/anamnesis', '/pago/abc']) {
      usePathnameMock.mockReturnValue(path);
      const { unmount } = render(<TopbarSesion />);

      const button = screen.getByRole('link', { name: 'Nueva consulta' });
      expect(button).not.toHaveClass('hidden');
      expect(button).not.toHaveClass('md:hidden');
      unmount();
    }
  });

  describe('botón de menú (móvil)', () => {
    it('is not rendered without onMenuToggle', () => {
      usePathnameMock.mockReturnValue('/inicio');
      render(<TopbarSesion />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('only shows on small screens (md:hidden) and controls the navigation panel', () => {
      usePathnameMock.mockReturnValue('/inicio');
      render(<TopbarSesion onMenuToggle={vi.fn()} />);

      const button = screen.getByRole('button', { name: 'Abrir menú' });
      expect(button).toHaveClass('md:hidden');
      expect(button).toHaveAttribute('aria-controls', 'sesion-nav');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('calls onMenuToggle when clicked', () => {
      usePathnameMock.mockReturnValue('/inicio');
      const onMenuToggle = vi.fn();
      render(<TopbarSesion onMenuToggle={onMenuToggle} />);

      fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));

      expect(onMenuToggle).toHaveBeenCalledTimes(1);
    });

    it('offers to close the menu (aria-expanded=true, different icon) while it is open', () => {
      usePathnameMock.mockReturnValue('/inicio');
      const { rerender } = render(<TopbarSesion onMenuToggle={vi.fn()} />);
      const closedIcon = screen.getByRole('button', { name: 'Abrir menú' }).querySelector('svg')?.innerHTML;

      rerender(<TopbarSesion menuOpen onMenuToggle={vi.fn()} />);

      const button = screen.getByRole('button', { name: 'Cerrar menú' });
      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(button.querySelector('svg')?.innerHTML).not.toBe(closedIcon);
    });

    it('sits before the logo', () => {
      usePathnameMock.mockReturnValue('/inicio');
      render(<TopbarSesion onMenuToggle={vi.fn()} />);

      const button = screen.getByRole('button', { name: 'Abrir menú' });
      const logo = screen.getByRole('link', { name: 'Nuvi' });
      expect(button.compareDocumentPosition(logo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
  });
});
