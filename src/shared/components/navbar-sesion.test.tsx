import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { NavbarSesion } from './navbar-sesion.component';

const usePathnameMock = vi.fn();
vi.mock('next/navigation', () => ({ usePathname: () => usePathnameMock() }));

describe('NavbarSesion', () => {
  it('renders links to /panel ("Home"), /planes, /mediciones, /perfil and the logout endpoint', () => {
    usePathnameMock.mockReturnValue('/panel');
    render(<NavbarSesion />);

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/panel');
    expect(screen.getByRole('link', { name: 'Planes' })).toHaveAttribute('href', '/planes');
    expect(screen.getByRole('link', { name: 'Mediciones' })).toHaveAttribute('href', '/mediciones');
    expect(screen.getByRole('link', { name: 'Perfil' })).toHaveAttribute('href', '/perfil');
    expect(screen.getByRole('link', { name: 'Cerrar sesión' })).toHaveAttribute('href', '/api/cognito/logout');
  });

  it('lists the links in order: Home, Planes, Mediciones, Perfil, Cerrar sesión (no "Nueva consulta": lives in the topbar)', () => {
    usePathnameMock.mockReturnValue('/panel');
    render(<NavbarSesion />);

    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Home',
      'Planes',
      'Mediciones',
      'Perfil',
      'Cerrar sesión',
    ]);
    expect(screen.queryByRole('link', { name: 'Nueva consulta' })).not.toBeInTheDocument();
  });

  it('is md+ only: hidden by default and flex from md, docked under the topbar (top-15)', () => {
    usePathnameMock.mockReturnValue('/panel');
    const { container } = render(<NavbarSesion />);

    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('hidden', 'md:flex', 'fixed', 'left-0', 'top-15');
  });

  describe('link activo', () => {
    // El resaltado es el color del texto (no un fondo) + un indicador vertical a la izquierda.
    const expectActive = (name: string) => {
      const link = screen.getByRole('link', { name });
      expect(link).toHaveStyle({ color: 'var(--color-primary)' });
      expect(link).not.toHaveStyle({ backgroundColor: 'var(--color-primary)' });

      const indicator = within(link).getByTestId('nav-active-indicator');
      expect(indicator).toHaveAttribute('aria-hidden', 'true');
      expect(indicator).toHaveStyle({ backgroundColor: 'var(--color-primary)' });
    };
    const expectInactive = (name: string) => {
      const link = screen.getByRole('link', { name });
      expect(link).not.toHaveStyle({ color: 'var(--color-primary)' });
      expect(link).not.toHaveStyle({ backgroundColor: 'var(--color-primary)' });
      expect(within(link).queryByTestId('nav-active-indicator')).not.toBeInTheDocument();
    };

    it('highlights "Home" as active when the current pathname is /panel', () => {
      usePathnameMock.mockReturnValue('/panel');
      render(<NavbarSesion />);

      expectActive('Home');
      expectInactive('Perfil');
    });

    it('highlights /perfil as active when the current pathname is /perfil', () => {
      usePathnameMock.mockReturnValue('/perfil');
      render(<NavbarSesion />);

      expectActive('Perfil');
      expectInactive('Home');
    });

    it.each([
      ['/planes', 'Planes'],
      ['/mediciones', 'Mediciones'],
    ])('highlights only the matching link when the current pathname is %s', (pathname, active) => {
      usePathnameMock.mockReturnValue(pathname);
      render(<NavbarSesion />);

      expectActive(active);
      for (const name of ['Home', 'Planes', 'Mediciones', 'Perfil'].filter((n) => n !== active)) {
        expectInactive(name);
      }
    });

    it('highlights nothing on /consulta/anamnesis ("Nueva consulta" is no longer a sidebar item)', () => {
      usePathnameMock.mockReturnValue('/consulta/anamnesis');
      render(<NavbarSesion />);

      expectInactive('Home');
      expectInactive('Perfil');
      expect(screen.queryByTestId('nav-active-indicator')).not.toBeInTheDocument();
    });

    it('highlights no link when the current pathname matches none', () => {
      usePathnameMock.mockReturnValue('/otra-ruta');
      render(<NavbarSesion />);

      expectInactive('Home');
      expectInactive('Perfil');
      expect(screen.queryByTestId('nav-active-indicator')).not.toBeInTheDocument();
    });

    it('renders exactly one active indicator (absolute, left edge, 5px wide)', () => {
      usePathnameMock.mockReturnValue('/perfil');
      render(<NavbarSesion />);

      const indicators = screen.getAllByTestId('nav-active-indicator');
      expect(indicators).toHaveLength(1);
      expect(indicators[0]).toHaveClass('absolute', 'left-0', 'inset-y-0', 'w-[5px]');
    });

    it('never marks the logout link as active', () => {
      usePathnameMock.mockReturnValue('/api/cognito/logout');
      render(<NavbarSesion />);

      expect(screen.queryByTestId('nav-active-indicator')).not.toBeInTheDocument();
    });
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

    it('renders the toggle as a small 16x32px button over the right border (no md-only classes)', () => {
      usePathnameMock.mockReturnValue('/panel');
      render(<NavbarSesion onToggle={vi.fn()} />);

      const button = screen.getByRole('button', { name: 'Acoplar menú lateral' });
      expect(button).toHaveClass('flex', 'absolute', 'right-0', 'top-1/2', 'w-4', 'h-8', 'cursor-pointer');
      expect(button).not.toHaveClass('hidden');
    });

    it('draws an icon inside the toggle in both states (chevron left / chevron right)', () => {
      usePathnameMock.mockReturnValue('/panel');
      const { rerender } = render(<NavbarSesion collapsed={false} onToggle={vi.fn()} />);
      const openIcon = screen.getByRole('button', { name: 'Acoplar menú lateral' }).querySelector('svg');
      expect(openIcon).toBeInTheDocument();

      rerender(<NavbarSesion collapsed onToggle={vi.fn()} />);
      const closedIcon = screen.getByRole('button', { name: 'Desacoplar menú lateral' }).querySelector('svg');
      expect(closedIcon).toBeInTheDocument();
      // Icono distinto según el estado (ChevronLeft vs ChevronRight).
      expect(closedIcon?.innerHTML).not.toBe(openIcon?.innerHTML);
    });

    it('defaults to not collapsed when only onToggle is passed', () => {
      usePathnameMock.mockReturnValue('/panel');
      render(<NavbarSesion onToggle={vi.fn()} />);

      expect(screen.getByRole('button', { name: 'Acoplar menú lateral' })).toBeInTheDocument();
    });

    it('does not hide the links when not collapsed', () => {
      usePathnameMock.mockReturnValue('/panel');
      render(<NavbarSesion collapsed={false} onToggle={vi.fn()} />);

      for (const name of ['Home', 'Planes', 'Mediciones', 'Perfil', 'Cerrar sesión']) {
        expect(screen.getByRole('link', { name })).not.toHaveClass('hidden');
      }
    });

    it('hides every link (hidden) when collapsed, leaving only the toggle', () => {
      usePathnameMock.mockReturnValue('/panel');
      render(<NavbarSesion collapsed onToggle={vi.fn()} />);

      for (const name of ['Home', 'Planes', 'Mediciones', 'Perfil', 'Cerrar sesión']) {
        expect(screen.getByRole('link', { name })).toHaveClass('hidden');
      }
    });

    it('narrows the sidebar (w-14) when collapsed and widens it (w-56) otherwise', () => {
      usePathnameMock.mockReturnValue('/panel');
      const { container, rerender } = render(<NavbarSesion collapsed onToggle={vi.fn()} />);
      expect(container.querySelector('nav')).toHaveClass('w-14');
      expect(container.querySelector('nav')).not.toHaveClass('w-56');

      rerender(<NavbarSesion collapsed={false} onToggle={vi.fn()} />);
      expect(container.querySelector('nav')).toHaveClass('w-56');
      expect(container.querySelector('nav')).not.toHaveClass('w-14');
    });

    describe('click (burbujea al <nav>)', () => {
      it('calls onToggle once when clicking the nav outside of any link', () => {
        usePathnameMock.mockReturnValue('/panel');
        const onToggle = vi.fn();
        const { container } = render(<NavbarSesion onToggle={onToggle} />);

        fireEvent.click(container.querySelector('nav')!);

        expect(onToggle).toHaveBeenCalledTimes(1);
      });

      it('calls onToggle exactly once when clicking the button (bubbles to the nav, no double toggle)', () => {
        usePathnameMock.mockReturnValue('/panel');
        const onToggle = vi.fn();
        render(<NavbarSesion onToggle={onToggle} />);

        fireEvent.click(screen.getByRole('button', { name: 'Acoplar menú lateral' }));

        expect(onToggle).toHaveBeenCalledTimes(1);
      });

      it('calls onToggle exactly once when clicking the icon inside the button', () => {
        usePathnameMock.mockReturnValue('/panel');
        const onToggle = vi.fn();
        render(<NavbarSesion onToggle={onToggle} />);

        fireEvent.click(screen.getByRole('button').querySelector('svg')!);

        expect(onToggle).toHaveBeenCalledTimes(1);
      });

      it.each(['Home', 'Planes', 'Mediciones', 'Perfil', 'Cerrar sesión'])('does NOT call onToggle when clicking the "%s" link', (name) => {
        usePathnameMock.mockReturnValue('/panel');
        const onToggle = vi.fn();
        render(<NavbarSesion onToggle={onToggle} />);

        const link = screen.getByRole('link', { name });
        // jsdom intenta navegar al hacer click en un <a>; se cancela para no ensuciar la salida.
        link.addEventListener('click', (e) => e.preventDefault());
        fireEvent.click(link);

        expect(onToggle).not.toHaveBeenCalled();
      });

      it('does NOT call onToggle when clicking the text inside a link (target nested in the <a>)', () => {
        usePathnameMock.mockReturnValue('/panel');
        const onToggle = vi.fn();
        render(<NavbarSesion onToggle={onToggle} />);

        const link = screen.getByRole('link', { name: 'Perfil' });
        link.addEventListener('click', (e) => e.preventDefault());
        const inner = link.querySelector('svg') ?? link.firstElementChild;
        expect(inner).not.toBeNull();
        fireEvent.click(inner!);

        expect(onToggle).not.toHaveBeenCalled();
      });

      it('has cursor-pointer on the nav only when onToggle is provided', () => {
        usePathnameMock.mockReturnValue('/panel');
        const { container, rerender } = render(<NavbarSesion onToggle={vi.fn()} />);
        expect(container.querySelector('nav')).toHaveClass('cursor-pointer');

        rerender(<NavbarSesion />);
        expect(container.querySelector('nav')).not.toHaveClass('cursor-pointer');
      });

      it('without onToggle, clicking the nav does not throw and there is no cursor-pointer', () => {
        usePathnameMock.mockReturnValue('/panel');
        const { container } = render(<NavbarSesion />);
        const nav = container.querySelector('nav')!;

        expect(() => fireEvent.click(nav)).not.toThrow();
        expect(nav).not.toHaveClass('cursor-pointer');
      });
    });

    describe('resaltado del borde al pasar el mouse / foco sobre el botón', () => {
      const renderToggle = () => {
        usePathnameMock.mockReturnValue('/panel');
        const { container } = render(<NavbarSesion onToggle={vi.fn()} />);
        return {
          nav: container.querySelector('nav') as HTMLElement,
          button: screen.getByRole('button', { name: 'Acoplar menú lateral' }),
        };
      };

      it('has no highlight by default', () => {
        const { nav, button } = renderToggle();

        expect(button.style.borderColor).toBe('');
        expect(nav.style.borderRightColor).toBe('');
      });

      it('sets the border of the button and the right border of the nav to var(--color-primary) on mouseEnter, and removes them on mouseLeave', () => {
        const { nav, button } = renderToggle();

        fireEvent.mouseEnter(button);
        expect(button.style.borderColor).toBe('var(--color-primary)');
        expect(nav.style.borderRightColor).toBe('var(--color-primary)');

        fireEvent.mouseLeave(button);
        expect(button.style.borderColor).toBe('');
        expect(nav.style.borderRightColor).toBe('');
      });

      it('sets the same highlight on focus and removes it on blur', () => {
        const { nav, button } = renderToggle();

        fireEvent.focus(button);
        expect(button.style.borderColor).toBe('var(--color-primary)');
        expect(nav.style.borderRightColor).toBe('var(--color-primary)');

        fireEvent.blur(button);
        expect(button.style.borderColor).toBe('');
        expect(nav.style.borderRightColor).toBe('');
      });
    });
  });
});
