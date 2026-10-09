import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { Footer } from './footer.component';

afterEach(() => {
  vi.useRealTimers();
});

describe('Footer', () => {
  it('renders a <footer> landmark (contentinfo)', () => {
    render(<Footer />);

    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('links the brand name to the home page', () => {
    render(<Footer />);

    const brand = within(screen.getByRole('contentinfo')).getByRole('link', { name: 'Fitplan - Nutricionista Virtual' });
    expect(brand).toHaveAttribute('href', '/');
  });

  it('exposes a labelled nav with the three landing-section links, in order', () => {
    render(<Footer />);

    const nav = within(screen.getByRole('navigation', { name: 'Enlaces del pie de página' }));
    const links = nav.getAllByRole('link');

    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Consulta Virtual', '/#consulta-nutricional-virtual'],
      ['Plan Personal', '/#plan-personal'],
      ['Planes Estandar', '/#plan-estandarizado-por-disciplina'],
    ]);
  });

  it('keeps the brand link outside the footer nav', () => {
    render(<Footer />);

    const nav = screen.getByRole('navigation', { name: 'Enlaces del pie de página' });
    expect(nav).not.toContainElement(screen.getByRole('link', { name: 'Fitplan - Nutricionista Virtual' }));
  });

  it('shows the copyright with the current year', () => {
    render(<Footer />);

    expect(screen.getByText(`© ${new Date().getFullYear()} Fitplan. Todos los derechos reservados.`)).toBeInTheDocument();
  });

  it('computes the copyright year at render time (not hardcoded)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2031-06-15T12:00:00Z'));
    render(<Footer />);

    expect(screen.getByText('© 2031 Fitplan. Todos los derechos reservados.')).toBeInTheDocument();
  });
});
