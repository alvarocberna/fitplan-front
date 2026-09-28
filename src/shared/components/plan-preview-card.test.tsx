import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlanPreviewCard } from './plan-preview-card.component';

const pdfUrl = 'https://signed.example/order-1.pdf';
const thumbnailUrl = 'https://signed.example/order-1.webp';
const creationDate = '2026-01-15T12:00:00.000Z';

describe('PlanPreviewCard', () => {
  it('shows the generation date, the thumbnail and a download button pointing to the full PDF', () => {
    render(<PlanPreviewCard pdfUrl={pdfUrl} thumbnailUrl={thumbnailUrl} creationDate={creationDate} />);

    expect(screen.getByText('Generado el 15/01/2026')).toBeInTheDocument();

    const thumbnail = screen.getByAltText('Vista previa del plan nutricional generado el 15/01/2026');
    expect(thumbnail).toHaveAttribute('src', thumbnailUrl);
    expect(thumbnail).toHaveAttribute('loading', 'lazy');

    const download = screen.getByRole('link', { name: /Descargar/ });
    expect(download).toHaveTextContent('Descargar');
    expect(download).toHaveAttribute('href', pdfUrl);
    expect(download).toHaveAttribute('download');
    expect(screen.queryByText('Vista previa no disponible')).not.toBeInTheDocument();
  });

  it('omits the date caption and uses a generic alt when no creationDate is given (/ordenes/[id])', () => {
    render(<PlanPreviewCard pdfUrl={pdfUrl} thumbnailUrl={thumbnailUrl} />);

    expect(screen.queryByText(/Generado el/)).not.toBeInTheDocument();
    expect(screen.getByAltText('Vista previa de tu plan nutricional')).toHaveAttribute('src', thumbnailUrl);
    expect(screen.getByRole('link', { name: 'Descargar plan nutricional' })).toHaveAttribute('href', pdfUrl);
  });

  it('falls back to a placeholder, keeping the download button, when the plan has no thumbnail', () => {
    render(<PlanPreviewCard pdfUrl={pdfUrl} thumbnailUrl={null} creationDate={creationDate} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Vista previa no disponible')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Descargar/ })).toHaveAttribute('href', pdfUrl);
  });

  it('treats a missing thumbnailUrl (backend not yet updated) as no thumbnail', () => {
    // simula un backend viejo que todavía no envía el campo
    const legacyProps = { pdfUrl, creationDate } as unknown as Parameters<typeof PlanPreviewCard>[0];

    render(<PlanPreviewCard {...legacyProps} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Vista previa no disponible')).toBeInTheDocument();
  });

  it('uses a custom label for the download button when given', () => {
    render(<PlanPreviewCard pdfUrl={pdfUrl} thumbnailUrl={thumbnailUrl} downloadLabel="Descargar plan" />);

    expect(screen.getByRole('link', { name: 'Descargar plan nutricional' })).toHaveTextContent('Descargar plan');
  });
});
