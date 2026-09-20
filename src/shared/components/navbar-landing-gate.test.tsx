import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NavbarLandingGate } from './navbar-landing-gate.component';

const usePathnameMock = vi.fn();
vi.mock('next/navigation', () => ({ usePathname: () => usePathnameMock() }));

vi.mock('@/features/home/components/navbar-landing.component', () => ({
  NavbarLanding: () => <div data-testid="navbar-landing" />,
}));

describe('NavbarLandingGate', () => {
  it.each([
    '/consulta',
    '/consulta/inicio',
    '/consulta/anamnesis',
    '/ordenes/abc-123',
    '/panel',
    '/perfil',
    '/dev',
    '/dev/algo',
  ])('renders nothing on %s', (pathname) => {
    usePathnameMock.mockReturnValue(pathname);
    const { container } = render(<NavbarLandingGate />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId('navbar-landing')).not.toBeInTheDocument();
  });

  it.each(['/', '/articulos', '/login', '/pago/abc-123'])('renders NavbarLanding on %s', (pathname) => {
    usePathnameMock.mockReturnValue(pathname);
    render(<NavbarLandingGate />);

    expect(screen.getByTestId('navbar-landing')).toBeInTheDocument();
  });
});
