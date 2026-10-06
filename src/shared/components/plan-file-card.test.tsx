import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { PlanFileCard } from './plan-file-card.component';

vi.mock('next/navigation', () => ({ usePathname: vi.fn() }));
const mockedUsePathname = vi.mocked(usePathname);

const pdfUrl = 'https://signed.example/order-1.pdf';
const thumbnailUrl = 'https://signed.example/order-1.webp';

beforeEach(() => {
  mockedUsePathname.mockReturnValue('/planes/order-1');
});

describe('PlanFileCard', () => {
  it('shows the thumbnail and a download button pointing to the full PDF', () => {
    render(<PlanFileCard pdfUrl={pdfUrl} thumbnailUrl={thumbnailUrl} />);

    const card = screen.getByRole('region', { name: 'Archivo del plan' });
    const thumbnail = within(card).getByAltText('Vista previa de tu plan nutricional');
    expect(thumbnail).toHaveAttribute('src', thumbnailUrl);
    expect(thumbnail).toHaveAttribute('loading', 'lazy');
    expect(within(card).getByText('Plan nutricional')).toBeInTheDocument();
    expect(within(card).getByText('PDF')).toBeInTheDocument();

    const download = within(card).getByRole('link', { name: 'Descargar plan nutricional' });
    expect(download).toHaveTextContent('Descargar plan');
    expect(download).toHaveAttribute('href', pdfUrl);
    expect(download).toHaveAttribute('download');
    expect(screen.queryByText('Vista previa no disponible')).not.toBeInTheDocument();
  });

  it('falls back to a placeholder, keeping the download button, when the plan has no thumbnail', () => {
    render(<PlanFileCard pdfUrl={pdfUrl} thumbnailUrl={null} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Vista previa no disponible')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Descargar plan nutricional' })).toHaveAttribute('href', pdfUrl);
  });

  it('shows "Ir a inicio" (→ /inicio) on /ordenes/[id]', () => {
    mockedUsePathname.mockReturnValue('/ordenes/order-1');
    render(<PlanFileCard pdfUrl={pdfUrl} thumbnailUrl={thumbnailUrl} />);

    expect(screen.getByRole('link', { name: 'Ir a inicio' })).toHaveAttribute('href', '/inicio');
  });

  it('hides "Ir a inicio" on /planes/[orderId]', () => {
    render(<PlanFileCard pdfUrl={pdfUrl} thumbnailUrl={thumbnailUrl} />);

    expect(screen.queryByRole('link', { name: 'Ir a inicio' })).not.toBeInTheDocument();
  });
});
