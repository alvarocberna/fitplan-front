import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SesionShell } from './sesion-shell.component';

const usePathnameMock = vi.fn();
vi.mock('next/navigation', () => ({ usePathname: () => usePathnameMock() }));

const DOCK = 'Acoplar menú lateral';
const UNDOCK = 'Desacoplar menú lateral';

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
    renderAt('/panel');

    expect(screen.getByRole('main')).toContainElement(screen.getByText('contenido'));
  });

  describe('default por ruta', () => {
    it.each(['/panel', '/perfil'])('starts undocked (wide sidebar) on %s', (pathname) => {
      renderAt(pathname);

      expect(screen.getByRole('button', { name: DOCK })).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('main')).toHaveClass('md:pl-56');
      expect(screen.getByRole('main')).not.toHaveClass('md:pl-14');
    });

    it.each([
      '/consulta/inicio',
      '/consulta/anamnesis',
      '/consulta/generar-orden',
      '/ordenes/abc-123',
    ])('starts docked (narrow sidebar) on %s', (pathname) => {
      renderAt(pathname);

      expect(screen.getByRole('button', { name: UNDOCK })).toHaveAttribute('aria-expanded', 'false');
      expect(screen.getByRole('main')).toHaveClass('md:pl-14');
      expect(screen.getByRole('main')).not.toHaveClass('md:pl-56');
    });

    it('hides the nav links on md+ when docked and shows them when undocked', () => {
      const { unmount } = renderAt('/consulta/inicio');
      expect(screen.getByRole('link', { name: 'Panel' })).toHaveClass('md:hidden');
      unmount();

      renderAt('/panel');
      expect(screen.getByRole('link', { name: 'Panel' })).not.toHaveClass('md:hidden');
    });
  });

  describe('toggle', () => {
    it('docks the sidebar on /panel when the toggle is clicked', () => {
      renderAt('/panel');

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
      renderAt('/panel');

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

    it('keeps the manual choice when navigating within the same section (/panel <-> /perfil)', () => {
      const { rerender } = renderAt('/panel');
      fireEvent.click(screen.getByRole('button', { name: DOCK }));
      expect(screen.getByRole('main')).toHaveClass('md:pl-14');

      navigateTo(rerender, '/perfil');

      expect(screen.getByRole('button', { name: UNDOCK })).toBeInTheDocument();
      expect(screen.getByRole('main')).toHaveClass('md:pl-14');
    });
  });

  describe('reset al cambiar de sección', () => {
    it('falls back to the default of the new section: /panel (docked manually) -> /consulta (docked by default)', () => {
      const { rerender } = renderAt('/panel');
      fireEvent.click(screen.getByRole('button', { name: DOCK }));

      navigateTo(rerender, '/consulta/inicio');

      // default de /consulta/* es acoplado; la elección hecha en /panel no se arrastra
      expect(screen.getByRole('button', { name: UNDOCK })).toBeInTheDocument();
      expect(screen.getByRole('main')).toHaveClass('md:pl-14');
    });

    it('falls back to the default of the new section: /consulta (undocked manually) -> /panel (undocked by default)', () => {
      const { rerender } = renderAt('/consulta/inicio');
      fireEvent.click(screen.getByRole('button', { name: UNDOCK }));
      expect(screen.getByRole('main')).toHaveClass('md:pl-56');

      navigateTo(rerender, '/panel');

      expect(screen.getByRole('button', { name: DOCK })).toBeInTheDocument();
      expect(screen.getByRole('main')).toHaveClass('md:pl-56');
    });

    it('discards the old manual choice for good: returning to the section where it was made shows the default again', () => {
      const { rerender } = renderAt('/panel');
      fireEvent.click(screen.getByRole('button', { name: DOCK })); // manual: acoplado en /panel

      navigateTo(rerender, '/consulta/inicio');
      navigateTo(rerender, '/panel');

      // el default de /panel es desacoplado: la elección manual previa ya no reaparece
      expect(screen.getByRole('button', { name: DOCK })).toBeInTheDocument();
      expect(screen.getByRole('main')).toHaveClass('md:pl-56');
    });
  });
});
