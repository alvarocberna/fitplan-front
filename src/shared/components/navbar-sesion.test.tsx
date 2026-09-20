import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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

  describe('toggle del sidebar', () => {
    it('does not render the toggle button when onToggle is not provided', () => {
      usePathnameMock.mockReturnValue('/panel');
      render(<NavbarSesion />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders the toggle button when onToggle is provided', () => {
      usePathnameMock.mockReturnValue('/panel');
      render(<NavbarSesion onToggle={vi.fn()} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('calls onToggle when the toggle button is clicked', () => {
      usePathnameMock.mockReturnValue('/panel');
      const onToggle = vi.fn();
      render(<NavbarSesion collapsed={false} onToggle={onToggle} />);

      fireEvent.click(screen.getByRole('button', { name: 'Acoplar menú lateral' }));

      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('offers to dock the sidebar (aria-expanded=true) when it is not collapsed', () => {
      usePathnameMock.mockReturnValue('/panel');
      render(<NavbarSesion collapsed={false} onToggle={vi.fn()} />);

      const button = screen.getByRole('button', { name: 'Acoplar menú lateral' });
      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(screen.queryByRole('button', { name: 'Desacoplar menú lateral' })).not.toBeInTheDocument();
    });

    it('offers to undock the sidebar (aria-expanded=false) when it is collapsed', () => {
      usePathnameMock.mockReturnValue('/panel');
      render(<NavbarSesion collapsed onToggle={vi.fn()} />);

      const button = screen.getByRole('button', { name: 'Desacoplar menú lateral' });
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByRole('button', { name: 'Acoplar menú lateral' })).not.toBeInTheDocument();
    });

    it('defaults to not collapsed when only onToggle is passed', () => {
      usePathnameMock.mockReturnValue('/panel');
      render(<NavbarSesion onToggle={vi.fn()} />);

      expect(screen.getByRole('button', { name: 'Acoplar menú lateral' })).toBeInTheDocument();
    });

    it('does not hide the links on md+ when not collapsed', () => {
      usePathnameMock.mockReturnValue('/panel');
      render(<NavbarSesion collapsed={false} onToggle={vi.fn()} />);

      expect(screen.getByRole('link', { name: 'Panel' })).not.toHaveClass('md:hidden');
      expect(screen.getByRole('link', { name: 'Perfil' })).not.toHaveClass('md:hidden');
      expect(screen.getByRole('link', { name: 'Cerrar sesión' })).not.toHaveClass('md:hidden');
    });

    it('hides every link on md+ (md:hidden) when collapsed', () => {
      usePathnameMock.mockReturnValue('/panel');
      render(<NavbarSesion collapsed onToggle={vi.fn()} />);

      expect(screen.getByRole('link', { name: 'Panel' })).toHaveClass('md:hidden');
      expect(screen.getByRole('link', { name: 'Perfil' })).toHaveClass('md:hidden');
      expect(screen.getByRole('link', { name: 'Cerrar sesión' })).toHaveClass('md:hidden');
    });

    it('narrows the sidebar (md:w-14) when collapsed and widens it (md:w-56) otherwise', () => {
      usePathnameMock.mockReturnValue('/panel');
      const { container, rerender } = render(<NavbarSesion collapsed onToggle={vi.fn()} />);
      expect(container.querySelector('nav')).toHaveClass('md:w-14');

      rerender(<NavbarSesion collapsed={false} onToggle={vi.fn()} />);
      expect(container.querySelector('nav')).toHaveClass('md:w-56');
    });
  });
});
