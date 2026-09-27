import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlansList } from './plans-list.component';
import type { OrderSummaryDto } from '../../consultation/dtos/order.dto';

describe('PlansList', () => {
  it('shows the "no plans yet" message when the orders list is empty', () => {
    render(<PlansList orders={[]} />);

    expect(screen.getByText('Todavía no tienes ningún plan nutricional generado.')).toBeInTheDocument();
  });

  it('renders a plan preview per order, newest first as given by the caller', () => {
    const orders: OrderSummaryDto[] = [
      {
        orderId: 'order-2',
        creationDate: '2026-02-01T00:00:00.000Z',
        pdfUrl: 'https://signed.example/order-2.pdf',
        thumbnailUrl: 'https://signed.example/order-2.webp',
      },
      {
        orderId: 'order-1',
        creationDate: '2026-01-01T00:00:00.000Z',
        pdfUrl: 'https://signed.example/order-1.pdf',
        thumbnailUrl: 'https://signed.example/order-1.webp',
      },
    ];

    render(<PlansList orders={orders} />);

    const thumbnails = screen.getAllByAltText(/Vista previa del plan nutricional/);
    expect(thumbnails).toHaveLength(2);
    expect(thumbnails[0]).toHaveAttribute('src', 'https://signed.example/order-2.webp');
    expect(thumbnails[1]).toHaveAttribute('src', 'https://signed.example/order-1.webp');

    const downloads = screen.getAllByRole('link', { name: /Descargar/ });
    expect(downloads).toHaveLength(2);
    expect(downloads[0]).toHaveAttribute('href', 'https://signed.example/order-2.pdf');
    expect(downloads[1]).toHaveAttribute('href', 'https://signed.example/order-1.pdf');

    // no se incrusta el PDF en un <iframe>
    expect(document.querySelector('iframe')).toBeNull();
    expect(screen.queryByText('Todavía no tienes ningún plan nutricional generado.')).not.toBeInTheDocument();
  });
});
