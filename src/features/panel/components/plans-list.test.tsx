import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { PlansList } from './plans-list.component';
import type { MyPlanSummaryDto } from '../dtos/my-plan.dto';

const generated: MyPlanSummaryDto = {
  orderId: 'order-1',
  type: 'GENERATED',
  name: 'Plan personalizado',
  purchasedAt: '2026-02-01T12:00:00.000Z',
  pdfUrl: 'https://signed.example/order-1.pdf',
  thumbnailUrl: 'https://signed.example/order-1.webp',
  summary: {
    goal: 'definicion',
    dietRegimen: 'Hipocalórico',
    calorieIntake: 2000,
    proteinIntake: 150,
    carbohydrateIntake: 200,
    lipidIntake: 60,
  },
};

const predefined: MyPlanSummaryDto = {
  orderId: 'order-2',
  type: 'PREDEFINED',
  name: 'Plan Running',
  purchasedAt: '2026-01-01T12:00:00.000Z',
  pdfUrl: 'https://signed.example/order-2.pdf',
  thumbnailUrl: null,
  summary: null,
};

// Texto completo de un <p> (sus partes están repartidas en varios <span>).
function paragraph(container: HTMLElement, text: string) {
  return within(container).getByText((_, element) => element?.tagName === 'P' && element.textContent === text);
}

describe('PlansList', () => {
  it('shows the "no plans yet" message when the list is empty', () => {
    render(<PlansList plans={[]} />);

    expect(screen.getByText('Todavía no tienes ningún plan nutricional generado.')).toBeInTheDocument();
  });

  it('renders one row per plan, in the order given by the backend, without the PDF thumbnail', () => {
    render(<PlansList plans={[generated, predefined]} />);

    const rows = screen.getAllByRole('listitem');
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText('Plan personalizado')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Plan Running')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('shows type, date, regimen and macros of each plan', () => {
    render(<PlansList plans={[generated]} />);

    const row = screen.getByRole('listitem', { name: 'Plan personalizado' });
    expect(within(row).getByText('Personalizado')).toBeInTheDocument();
    expect(paragraph(row, 'Fecha: 01/02/2026')).toBeInTheDocument();
    expect(paragraph(row, 'Régimen: Hipocalórico')).toBeInTheDocument();
    expect(
      paragraph(row, 'Calorías: 2000 kcal · Proteínas: 150 g · Carbohidratos: 200 g · Lípidos: 60 g'),
    ).toBeInTheDocument();
  });

  it('shows placeholders when the plan has no summary (standard plan without data)', () => {
    render(<PlansList plans={[predefined]} />);

    const row = screen.getByRole('listitem', { name: 'Plan Running' });
    expect(within(row).getByText('Estándar')).toBeInTheDocument();
    expect(paragraph(row, 'Régimen: —')).toBeInTheDocument();
    expect(paragraph(row, 'Calorías y macros: —')).toBeInTheDocument();
  });

  it('ends each row with "Ver plan" (detail) and "Descargar plan" (signed PDF URL)', () => {
    render(<PlansList plans={[generated]} />);

    const row = screen.getByRole('listitem', { name: 'Plan personalizado' });
    const view = within(row).getByRole('link', { name: 'Ver plan Plan personalizado' });
    expect(view).toHaveAttribute('href', '/planes/order-1');
    expect(view).toHaveTextContent('Ver plan');

    const download = within(row).getByRole('link', { name: 'Descargar plan Plan personalizado' });
    expect(download).toHaveAttribute('href', 'https://signed.example/order-1.pdf');
    expect(download).toHaveAttribute('download');
    expect(download).toHaveTextContent('Descargar plan');
  });
});
