import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PanelSummary } from './panel-summary.component';
import type { PanelSummaryDto } from '../dtos/panel-summary.dto';
import type { OrderSummaryDto } from '../../consultation/dtos/order.dto';

const baseSummary: PanelSummaryDto = {
  firstName: 'Ana',
  paternalLastName: 'Pérez',
  age: 34,
  goal: 'Bajar de peso',
  nutritionalPlan: null,
};

const baseOrders: OrderSummaryDto[] = [];

describe('PanelSummary', () => {
  it('renders the user info fields', () => {
    render(<PanelSummary summary={baseSummary} orders={baseOrders} />);

    expect(screen.getByText('Ana Pérez')).toBeInTheDocument();
    expect(screen.getByText('34')).toBeInTheDocument();
    expect(screen.getByText('Bajar de peso')).toBeInTheDocument();
  });

  it('shows placeholders when name, age and goal are missing', () => {
    render(
      <PanelSummary
        summary={{ firstName: null, paternalLastName: null, age: null, goal: null, nutritionalPlan: null }}
        orders={baseOrders}
      />,
    );

    expect(screen.getByText('Sin datos')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('Aún no definido')).toBeInTheDocument();
  });

  it('shows the "no plan yet" message when nutritionalPlan is null', () => {
    render(<PanelSummary summary={baseSummary} orders={baseOrders} />);

    expect(screen.getByText('Todavía no tienes un plan nutricional generado.')).toBeInTheDocument();
    expect(screen.queryByText('Calorías')).not.toBeInTheDocument();
  });

  it('renders the macro breakdown when a nutritionalPlan is present', () => {
    render(
      <PanelSummary
        summary={{
          ...baseSummary,
          nutritionalPlan: { calorieIntake: 2000, proteinIntake: 150, carbohydrateIntake: 200, lipidIntake: 60 },
        }}
        orders={baseOrders}
      />,
    );

    expect(screen.getByText('2000 kcal')).toBeInTheDocument();
    expect(screen.getByText('150 g')).toBeInTheDocument();
    expect(screen.getByText('200 g')).toBeInTheDocument();
    expect(screen.getByText('60 g')).toBeInTheDocument();
    expect(screen.queryByText('Todavía no tienes un plan nutricional generado.')).not.toBeInTheDocument();
  });

  it('shows the "no plans yet" message when the orders list is empty', () => {
    render(<PanelSummary summary={baseSummary} orders={[]} />);

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

    render(<PanelSummary summary={baseSummary} orders={orders} />);

    const thumbnails = screen.getAllByAltText(/Vista previa del plan nutricional/);
    expect(thumbnails).toHaveLength(2);
    expect(thumbnails[0]).toHaveAttribute('src', 'https://signed.example/order-2.webp');
    expect(thumbnails[1]).toHaveAttribute('src', 'https://signed.example/order-1.webp');

    const downloads = screen.getAllByRole('link', { name: /Descargar/ });
    expect(downloads).toHaveLength(2);
    expect(downloads[0]).toHaveAttribute('href', 'https://signed.example/order-2.pdf');
    expect(downloads[1]).toHaveAttribute('href', 'https://signed.example/order-1.pdf');

    // ya no se incrusta el PDF en un <iframe>
    expect(document.querySelector('iframe')).toBeNull();
    expect(screen.queryByText('Todavía no tienes ningún plan nutricional generado.')).not.toBeInTheDocument();
  });
});
