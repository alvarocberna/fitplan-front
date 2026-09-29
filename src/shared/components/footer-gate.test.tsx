import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FooterGate } from './footer-gate.component';

const usePathnameMock = vi.fn();
vi.mock('next/navigation', () => ({ usePathname: () => usePathnameMock() }));

vi.mock('./footer.component', () => ({
  Footer: () => <footer data-testid="footer" />,
}));

describe('FooterGate', () => {
  // En estas rutas SesionShell monta su propio Footer (con el padding del sidebar): el del layout
  // raíz no debe duplicarlo.
  it.each([
    '/inicio',
    '/perfil',
    '/consulta',
    '/consulta/inicio',
    '/pago/abc-123',
    '/ordenes/abc-123',
  ])('renders nothing on %s', (pathname) => {
    usePathnameMock.mockReturnValue(pathname);
    const { container } = render(<FooterGate />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId('footer')).not.toBeInTheDocument();
  });

  it.each(['/', '/articulos', '/login', '/dev', '/dev/algo'])('renders the Footer on %s', (pathname) => {
    usePathnameMock.mockReturnValue(pathname);
    render(<FooterGate />);

    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});
