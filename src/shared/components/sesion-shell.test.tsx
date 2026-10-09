import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { SesionShell } from './sesion-shell.component';

const usePathnameMock = vi.fn();
vi.mock('next/navigation', () => ({ usePathname: () => usePathnameMock() }));

const DOCK = 'Acoplar menú lateral';
const UNDOCK = 'Desacoplar menú lateral';

// El menú de navegación (sidebar en md+, panel deslizable en móvil) es el <nav> que contiene el botón
// de acoplar/desacoplar.
function sidebar() {
  const nav = screen.getByRole('button', { name: /menú lateral/ }).closest('nav');
  if (!nav) throw new Error('sidebar <nav> not found');
  return nav;
}

function renderAt(pathname: string) {
  usePathnameMock.mockReturnValue(pathname);
  return render(
    <SesionShell>
      <p>contenido</p>
    </SesionShell>,
  );
}

// Re-renderiza el mismo árbol (sin remontar) tras cambiar de ruta, como hace el layout compartido
// al navegar entre páginas del route group (sesion).
function navigateTo(rerender: ReturnType<typeof render>['rerender'], pathname: string) {
  usePathnameMock.mockReturnValue(pathname);
  rerender(
    <SesionShell>
      <p>contenido</p>
    </SesionShell>,
  );
}

describe('SesionShell', () => {
  it('renders its children inside <main>', () => {
    renderAt('/inicio');

    expect(screen.getByRole('main')).toContainElement(screen.getByText('contenido'));
  });

  describe('default por ruta', () => {
    it.each(['/inicio', '/planes', '/mediciones', '/perfil'])('starts undocked (wide sidebar) on %s', (pathname) => {
      renderAt(pathname);

      expect(screen.getByRole('button', { name: DOCK })).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('main')).toHaveClass('md:pl-56');
      expect(screen.getByRole('main')).not.toHaveClass('md:pl-14');
    });

    it.each([
      '/consulta/inicio',
      '/consulta/anamnesis',
      '/consulta/generar-orden',
      '/pago/abc-123',
      '/ordenes/abc-123',
    ])('starts docked (narrow sidebar) on %s', (pathname) => {
      renderAt(pathname);

      expect(screen.getByRole('button', { name: UNDOCK })).toHaveAttribute('aria-expanded', 'false');
      expect(screen.getByRole('main')).toHaveClass('md:pl-14');
      expect(screen.getByRole('main')).not.toHaveClass('md:pl-56');
    });

    it('hides the sidebar links when docked and shows them when undocked', () => {
      const { unmount } = renderAt('/consulta/inicio');
      expect(within(sidebar()).getByRole('link', { name: 'Inicio' })).toHaveClass('md:hidden');
      unmount();

      renderAt('/inicio');
      expect(within(sidebar()).getByRole('link', { name: 'Inicio' })).not.toHaveClass('md:hidden');
    });

    it('docking the sidebar only hides the links from md: the mobile panel keeps them', () => {
      renderAt('/consulta/inicio');

      for (const name of ['Inicio', 'Planes', 'Mediciones', 'Perfil', 'Cerrar sesión']) {
        expect(within(sidebar()).getByRole('link', { name })).not.toHaveClass('hidden');
      }
    });
  });

  describe('menú de navegación en móvil', () => {
    it('starts closed and opens/closes with the menu button of the topbar', () => {
      renderAt('/inicio');
      expect(sidebar()).toHaveClass('-translate-x-full', 'invisible');

      fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));
      expect(sidebar()).toHaveClass('translate-x-0', 'visible');
      expect(screen.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute('aria-expanded', 'true');

      fireEvent.click(screen.getByRole('button', { name: 'Cerrar menú' }));
      expect(sidebar()).toHaveClass('-translate-x-full', 'invisible');
    });

    it('closes when an option is chosen or the backdrop is tapped', () => {
      renderAt('/inicio');

      fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));
      const link = within(sidebar()).getByRole('link', { name: 'Perfil' });
      link.addEventListener('click', (e) => e.preventDefault());
      fireEvent.click(link);
      expect(sidebar()).toHaveClass('-translate-x-full');

      fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));
      fireEvent.click(screen.getByTestId('sesion-nav-backdrop'));
      expect(sidebar()).toHaveClass('-translate-x-full');
    });

    it('does not change the docked/undocked state of the desktop sidebar', () => {
      renderAt('/inicio');

      fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));
      fireEvent.click(screen.getByRole('button', { name: 'Cerrar menú' }));

      expect(screen.getByRole('button', { name: DOCK })).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('main')).toHaveClass('md:pl-56');
    });
  });

  describe('barra superior y padding del contenido', () => {
    it.each(['/inicio', '/consulta/inicio'])('renders the topbar (banner) with logo and "Nueva consulta" on %s', (pathname) => {
      renderAt(pathname);

      const topbar = within(screen.getByRole('banner'));
      expect(topbar.getByRole('link', { name: 'Fitplan' })).toHaveAttribute('href', '/');
      expect(topbar.getByRole('link', { name: 'Nueva consulta' })).toHaveAttribute('href', '/consulta/anamnesis');
    });

    it('renders the topbar and the sidebar as siblings of <main>, not inside it', () => {
      renderAt('/inicio');

      expect(screen.getByRole('main')).not.toContainElement(screen.getByRole('banner'));
      expect(screen.getByRole('main')).not.toContainElement(sidebar());
    });

    it.each(['/inicio', '/consulta/inicio'])('offsets <main> below the topbar (pt-19 md:pt-23) on %s', (pathname) => {
      renderAt(pathname);

      expect(screen.getByRole('main')).toHaveClass('pt-19', 'md:pt-23');
    });

    it('exposes the session links once (the same <nav> is the sidebar and the mobile panel)', () => {
      renderAt('/inicio');

      expect(screen.getAllByRole('link', { name: 'Inicio' })).toHaveLength(1);
      expect(screen.getAllByRole('link', { name: 'Perfil' })).toHaveLength(1);
      expect(screen.getAllByRole('link', { name: 'Cerrar sesión' })).toHaveLength(1);
      // "Nueva consulta" solo existe en la barra superior
      expect(screen.getAllByRole('link', { name: 'Nueva consulta' })).toHaveLength(1);
    });
  });

  describe('footer', () => {
    // El sidebar es fixed y taparía el borde izquierdo del footer: se monta en un wrapper hermano de
    // <main> con el mismo padding lateral que él.
    const footerWrapper = () => {
      const wrapper = screen.getByRole('contentinfo').parentElement;
      if (!wrapper) throw new Error('footer wrapper not found');
      return wrapper;
    };

    it.each(['/inicio', '/consulta/inicio'])('renders the Footer (contentinfo) on %s', (pathname) => {
      renderAt(pathname);

      expect(screen.getAllByRole('contentinfo')).toHaveLength(1);
      expect(
        within(screen.getByRole('navigation', { name: 'Enlaces del pie de página' })).getAllByRole('link'),
      ).toHaveLength(3);
    });

    it('renders the Footer as a sibling of <main>, not inside it', () => {
      renderAt('/inicio');

      expect(screen.getByRole('main')).not.toContainElement(screen.getByRole('contentinfo'));
      expect(footerWrapper()).not.toContainElement(screen.getByRole('main'));
      expect(footerWrapper().parentElement).toBe(screen.getByRole('main').parentElement);
    });

    it('renders the Footer after <main> in document order', () => {
      renderAt('/inicio');

      expect(
        screen.getByRole('main').compareDocumentPosition(screen.getByRole('contentinfo')) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it.each(['/inicio', '/planes', '/mediciones', '/perfil'])('gives the footer wrapper the undocked padding (md:pl-56) on %s', (pathname) => {
      renderAt(pathname);

      expect(footerWrapper()).toHaveClass('md:pl-56');
      expect(footerWrapper()).not.toHaveClass('md:pl-14');
    });

    it.each(['/consulta/inicio', '/pago/abc-123', '/ordenes/abc-123'])(
      'gives the footer wrapper the docked padding (md:pl-14) on %s',
      (pathname) => {
        renderAt(pathname);

        expect(footerWrapper()).toHaveClass('md:pl-14');
        expect(footerWrapper()).not.toHaveClass('md:pl-56');
      },
    );

    it('keeps the footer padding in sync with <main> when the sidebar is toggled', () => {
      renderAt('/inicio');
      expect(footerWrapper()).toHaveClass('md:pl-56');
      expect(screen.getByRole('main')).toHaveClass('md:pl-56');

      fireEvent.click(screen.getByRole('button', { name: DOCK }));
      expect(footerWrapper()).toHaveClass('md:pl-14');
      expect(footerWrapper()).not.toHaveClass('md:pl-56');
      expect(screen.getByRole('main')).toHaveClass('md:pl-14');

      fireEvent.click(screen.getByRole('button', { name: UNDOCK }));
      expect(footerWrapper()).toHaveClass('md:pl-56');
      expect(footerWrapper()).not.toHaveClass('md:pl-14');
    });

    it('resets the footer padding to the new section default when navigating between sections', () => {
      const { rerender } = renderAt('/inicio');
      fireEvent.click(screen.getByRole('button', { name: DOCK }));
      expect(footerWrapper()).toHaveClass('md:pl-14');

      navigateTo(rerender, '/consulta/inicio');
      expect(footerWrapper()).toHaveClass('md:pl-14');

      navigateTo(rerender, '/inicio');
      expect(footerWrapper()).toHaveClass('md:pl-56');
    });
  });

  describe('toggle', () => {
    it('docks the sidebar on /inicio when the toggle is clicked', () => {
      renderAt('/inicio');

      fireEvent.click(screen.getByRole('button', { name: DOCK }));

      expect(screen.getByRole('button', { name: UNDOCK })).toBeInTheDocument();
      expect(screen.getByRole('main')).toHaveClass('md:pl-14');
    });

    it('undocks the sidebar on /consulta/* when the toggle is clicked', () => {
      renderAt('/consulta/inicio');

      fireEvent.click(screen.getByRole('button', { name: UNDOCK }));

      expect(screen.getByRole('button', { name: DOCK })).toBeInTheDocument();
      expect(screen.getByRole('main')).toHaveClass('md:pl-56');
    });

    it('toggles back and forth on repeated clicks', () => {
      renderAt('/inicio');

      fireEvent.click(screen.getByRole('button', { name: DOCK }));
      fireEvent.click(screen.getByRole('button', { name: UNDOCK }));

      expect(screen.getByRole('button', { name: DOCK })).toBeInTheDocument();
      expect(screen.getByRole('main')).toHaveClass('md:pl-56');
    });
  });

  describe('persistencia de la elección manual', () => {
    it('keeps the manual choice when navigating within the same section (/consulta/* -> /consulta/*)', () => {
      const { rerender } = renderAt('/consulta/inicio');
      fireEvent.click(screen.getByRole('button', { name: UNDOCK }));
      expect(screen.getByRole('main')).toHaveClass('md:pl-56');

      navigateTo(rerender, '/consulta/anamnesis');

      expect(screen.getByRole('button', { name: DOCK })).toBeInTheDocument();
      expect(screen.getByRole('main')).toHaveClass('md:pl-56');
    });

    it('keeps the manual choice across /consulta/* and /ordenes/* (both are "focus" routes)', () => {
      const { rerender } = renderAt('/consulta/generar-orden');
      fireEvent.click(screen.getByRole('button', { name: UNDOCK }));

      navigateTo(rerender, '/ordenes/abc-123');

      expect(screen.getByRole('main')).toHaveClass('md:pl-56');
    });

    it('keeps the manual choice when navigating within the same section (/inicio <-> /perfil)', () => {
      const { rerender } = renderAt('/inicio');
      fireEvent.click(screen.getByRole('button', { name: DOCK }));
      expect(screen.getByRole('main')).toHaveClass('md:pl-14');

      navigateTo(rerender, '/perfil');

      expect(screen.getByRole('button', { name: UNDOCK })).toBeInTheDocument();
      expect(screen.getByRole('main')).toHaveClass('md:pl-14');
    });
  });

  describe('reset al cambiar de sección', () => {
    it('falls back to the default of the new section: /inicio (docked manually) -> /consulta (docked by default)', () => {
      const { rerender } = renderAt('/inicio');
      fireEvent.click(screen.getByRole('button', { name: DOCK }));

      navigateTo(rerender, '/consulta/inicio');

      // default de /consulta/* es acoplado; la elección hecha en /inicio no se arrastra
      expect(screen.getByRole('button', { name: UNDOCK })).toBeInTheDocument();
      expect(screen.getByRole('main')).toHaveClass('md:pl-14');
    });

    it('falls back to the default of the new section: /consulta (undocked manually) -> /inicio (undocked by default)', () => {
      const { rerender } = renderAt('/consulta/inicio');
      fireEvent.click(screen.getByRole('button', { name: UNDOCK }));
      expect(screen.getByRole('main')).toHaveClass('md:pl-56');

      navigateTo(rerender, '/inicio');

      expect(screen.getByRole('button', { name: DOCK })).toBeInTheDocument();
      expect(screen.getByRole('main')).toHaveClass('md:pl-56');
    });

    it('discards the old manual choice for good: returning to the section where it was made shows the default again', () => {
      const { rerender } = renderAt('/inicio');
      fireEvent.click(screen.getByRole('button', { name: DOCK })); // manual: acoplado en /inicio

      navigateTo(rerender, '/consulta/inicio');
      navigateTo(rerender, '/inicio');

      // el default de /inicio es desacoplado: la elección manual previa ya no reaparece
      expect(screen.getByRole('button', { name: DOCK })).toBeInTheDocument();
      expect(screen.getByRole('main')).toHaveClass('md:pl-56');
    });
  });
});
