import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { SESION_NAV_ITEMS, SesionNavLink } from './sesion-nav-link.component';

describe('SESION_NAV_ITEMS', () => {
  it('lists Home, Planes, Mediciones and Perfil, in that order ("Nueva consulta" lives in the topbar)', () => {
    expect(SESION_NAV_ITEMS.map(({ label, href }) => [label, href])).toEqual([
      ['Home', '/panel'],
      ['Planes', '/planes'],
      ['Mediciones', '/mediciones'],
      ['Perfil', '/perfil'],
    ]);
  });
});

describe('SesionNavLink', () => {
  const props = { href: '/panel', label: 'Home', icon: ArrowRightOnRectangleIcon };

  it('renders a link with the label and href', () => {
    render(<SesionNavLink {...props} />);

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/panel');
  });

  it('inactive: no primary color and no indicator', () => {
    render(<SesionNavLink {...props} />);

    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveStyle({ color: 'var(--color-primary)' });
    expect(screen.queryByTestId('nav-active-indicator')).not.toBeInTheDocument();
  });

  it('active: primary color plus the 5px side indicator (always visible, not md-only)', () => {
    render(<SesionNavLink {...props} isActive />);

    expect(screen.getByRole('link', { name: 'Home' })).toHaveStyle({ color: 'var(--color-primary)' });
    const indicator = screen.getByTestId('nav-active-indicator');
    expect(indicator).toHaveClass('absolute', 'left-0', 'inset-y-0', 'w-[5px]', 'rounded-full');
    expect(indicator).not.toHaveClass('hidden');
    expect(indicator).not.toHaveClass('md:block');
  });

  it('compact + active: primary color but no indicator', () => {
    render(<SesionNavLink {...props} isActive compact />);

    expect(screen.getByRole('link', { name: 'Home' })).toHaveStyle({ color: 'var(--color-primary)' });
    expect(screen.queryByTestId('nav-active-indicator')).not.toBeInTheDocument();
  });

  it('applies the extra className to the link', () => {
    render(<SesionNavLink {...props} className="hidden" />);

    expect(screen.getByRole('link', { name: 'Home' })).toHaveClass('hidden');
  });
});
