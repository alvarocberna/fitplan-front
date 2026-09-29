import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MyPlansList } from './my-plans-list.component';
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

// Valor (<dd>) del macronutriente con esa etiqueta; la etiqueta va en un <span> dentro del <dt>.
function macro(row: HTMLElement, label: string): string | null {
  const macros = row.querySelector('dl[aria-label="Macronutrientes"]') as HTMLElement;
  const term = within(macros).getByText((_, element) => element?.tagName === 'DT' && element.textContent === label);
  return within(term.parentElement as HTMLElement).getByRole('definition').textContent;
}

describe('MyPlansList', () => {
  it('shows the "no plans yet" message when the list is empty', () => {
    render(<MyPlansList plans={[]} />);

    expect(screen.getByText('Todavía no tienes ningún plan nutricional generado.')).toBeInTheDocument();
  });

  it('renders one card per plan, in the order given by the backend', () => {
    render(<MyPlansList plans={[generated, predefined]} />);

    const cards = screen.getAllByRole('listitem');
    expect(cards.map((card) => card.getAttribute('aria-label'))).toEqual(['Plan personalizado', 'Plan Running']);
  });

  it('shows name, type, purchase date and regimen of each plan', () => {
    render(<MyPlansList plans={[generated]} />);

    const card = screen.getByRole('listitem', { name: 'Plan personalizado' });
    expect(within(card).getByText('Personalizado')).toBeInTheDocument();
    expect(within(card).getByText('Comprado el 01/02/2026')).toBeInTheDocument();
    expect(within(card).getByText((_, el) => el?.tagName === 'P' && el.textContent === 'Régimen: Hipocalórico')).toBeInTheDocument();
  });

  it('shows the four macronutrients with value and unit, or "—" without a summary', () => {
    render(<MyPlansList plans={[generated, predefined]} />);

    const card = screen.getByRole('listitem', { name: 'Plan personalizado' });
    expect(macro(card, 'Calorías')).toBe('2000 kcal');
    expect(macro(card, 'Proteínas')).toBe('150 g');
    expect(macro(card, 'Carbohidratos')).toBe('200 g');
    expect(macro(card, 'Lípidos')).toBe('60 g');

    const standard = screen.getByRole('listitem', { name: 'Plan Running' });
    expect(macro(standard, 'Calorías')).toBe('—');
    expect(within(standard).getByText((_, el) => el?.tagName === 'P' && el.textContent === 'Régimen: —')).toBeInTheDocument();
  });

  it('ends each card with "Ver plan" (detail) and "Descargar plan" (signed PDF URL)', () => {
    render(<MyPlansList plans={[generated]} />);

    const card = screen.getByRole('listitem', { name: 'Plan personalizado' });
    expect(within(card).getByRole('link', { name: 'Ver plan Plan personalizado' })).toHaveAttribute('href', '/planes/order-1');
    const download = within(card).getByRole('link', { name: 'Descargar plan Plan personalizado' });
    expect(download).toHaveAttribute('href', 'https://signed.example/order-1.pdf');
    expect(download).toHaveAttribute('download');
  });

  it('marks only the first card (the latest plan) with the decorative tab', () => {
    render(<MyPlansList plans={[generated, predefined]} />);

    expect(screen.getAllByTestId('latest-plan-tab')).toHaveLength(1);
    const first = screen.getByRole('listitem', { name: 'Plan personalizado' });
    expect(within(first).getByTestId('latest-plan-tab')).toBeInTheDocument();
  });
});
