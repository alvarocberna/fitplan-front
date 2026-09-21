import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { PanelSummary } from './panel-summary.component';
import type { PanelSummaryDto } from '../dtos/panel-summary.dto';
import type { OrderSummaryDto } from '../../consultation/dtos/order.dto';

const baseSummary: PanelSummaryDto = {
  firstName: 'Ana',
  middleName: 'María',
  paternalLastName: 'Pérez',
  maternalLastName: 'Soto',
  age: 34,
  lastConsultationDate: '2026-03-15T12:00:00.000Z',
  goal: 'Bajar de peso',
  nutritionalPlan: {
    dietRegimen: 'Régimen hipocalórico hiperproteico.',
    calorieIntake: 2000,
    proteinIntake: 150,
    carbohydrateIntake: 200,
    lipidIntake: 60,
  },
};

const emptySummary: PanelSummaryDto = {
  firstName: null,
  middleName: null,
  paternalLastName: null,
  maternalLastName: null,
  age: null,
  lastConsultationDate: null,
  goal: null,
  nutritionalPlan: null,
};

const baseOrders: OrderSummaryDto[] = [];

// Valor (<dd>) de la fila cuyo <dt> es `label`.
function rowValue(label: string): string | null {
  const row = screen.getByText(label, { selector: 'dt' }).parentElement as HTMLElement;
  return within(row).getByRole('definition').textContent;
}

describe('PanelSummary', () => {
  it('renders one row per field in the "Mi información" card, in order', () => {
    render(<PanelSummary summary={baseSummary} orders={baseOrders} />);

    const labels = screen.getAllByRole('term').map((dt) => dt.textContent);
    expect(labels).toEqual([
      'Nombre completo',
      'Edad',
      'Fecha última consulta',
      'Objetivo',
      'Régimen',
      'Calorías',
      'Proteínas',
      'Carbohidratos',
      'Lípidos',
    ]);
  });

  it('renders the user info, consultation date, regimen and macros', () => {
    render(<PanelSummary summary={baseSummary} orders={baseOrders} />);

    expect(rowValue('Nombre completo')).toBe('Ana María Pérez Soto');
    expect(rowValue('Edad')).toBe('34');
    expect(rowValue('Fecha última consulta')).toBe('15/03/2026');
    expect(rowValue('Objetivo')).toBe('Bajar de peso');
    expect(rowValue('Régimen')).toBe('Régimen hipocalórico hiperproteico.');
    expect(rowValue('Calorías')).toBe('2000 kcal');
    expect(rowValue('Proteínas')).toBe('150 g');
    expect(rowValue('Carbohidratos')).toBe('200 g');
    expect(rowValue('Lípidos')).toBe('60 g');
  });

  it('skips missing name parts when building the full name', () => {
    render(
      <PanelSummary
        summary={{ ...baseSummary, middleName: null, maternalLastName: null }}
        orders={baseOrders}
      />,
    );

    expect(rowValue('Nombre completo')).toBe('Ana Pérez');
  });

  it('shows placeholders when there is no personal data, consultation or plan', () => {
    render(<PanelSummary summary={emptySummary} orders={baseOrders} />);

    expect(rowValue('Nombre completo')).toBe('Sin datos');
    expect(rowValue('Edad')).toBe('—');
    expect(rowValue('Fecha última consulta')).toBe('—');
    expect(rowValue('Objetivo')).toBe('Aún no definido');
    expect(rowValue('Régimen')).toBe('—');
    expect(rowValue('Calorías')).toBe('—');
    expect(rowValue('Proteínas')).toBe('—');
    expect(rowValue('Carbohidratos')).toBe('—');
    expect(rowValue('Lípidos')).toBe('—');
  });

  it('shows a placeholder for the regimen when the plan has none', () => {
    render(
      <PanelSummary
        summary={{ ...baseSummary, nutritionalPlan: { ...baseSummary.nutritionalPlan!, dietRegimen: null } }}
        orders={baseOrders}
      />,
    );

    expect(rowValue('Régimen')).toBe('—');
    expect(rowValue('Calorías')).toBe('2000 kcal');
  });

  it('no longer renders the "Último plan nutricional" card', () => {
    render(<PanelSummary summary={baseSummary} orders={baseOrders} />);

    expect(screen.queryByText('Último plan nutricional')).not.toBeInTheDocument();
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
