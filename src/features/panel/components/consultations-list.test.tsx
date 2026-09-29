import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ConsultationsList } from './consultations-list.component';
import type { ConsultationSummaryDto } from '../dtos/consultation-summary.dto';

const pending: ConsultationSummaryDto = {
  consultationId: 'c-2',
  consultationNumber: 2,
  consultationDate: '2026-05-10T12:00:00.000Z',
  mainGoal: 'Ganar masa muscular',
  planStatus: 'awaiting_payment',
  orderId: 'order-2',
  plan: null,
};

const ready: ConsultationSummaryDto = {
  consultationId: 'c-1',
  consultationNumber: 1,
  consultationDate: '2026-03-15T12:00:00.000Z',
  mainGoal: 'Bajar de peso',
  planStatus: 'ready',
  orderId: 'order-1',
  plan: {
    planName: 'Plan personalizado',
    goal: 'definicion',
    dietRegimen: 'Hipocalórico',
    calorieIntake: 2000,
    proteinIntake: 150,
    carbohydrateIntake: 200,
    lipidIntake: 60,
  },
};

function item(number: number): HTMLElement {
  return screen.getByRole('listitem', { name: `Consulta N°${number}` });
}

// Valor (<dd>) del macronutriente con esa etiqueta; la etiqueta va en un <span> dentro del <dt>.
function macro(row: HTMLElement, label: string): string | null {
  const term = within(row).getByText((_, element) => element?.tagName === 'DT' && element.textContent === label);
  return within(term.parentElement as HTMLElement).getByRole('definition').textContent;
}

describe('ConsultationsList', () => {
  it('renders one item per consultation, in the order given by the backend', () => {
    render(<ConsultationsList consultations={[pending, ready]} />);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText('Consulta N°2')).toBeInTheDocument();
    expect(within(items[1]).getByText('Consulta N°1')).toBeInTheDocument();
  });

  it('each item links to its consultation detail', () => {
    render(<ConsultationsList consultations={[pending, ready]} />);

    expect(within(item(1)).getByRole('link', { name: 'Ver consulta N°1' })).toHaveAttribute(
      'href',
      '/panel/consultas/c-1',
    );
    expect(within(item(2)).getByRole('link', { name: 'Ver consulta N°2' })).toHaveAttribute(
      'href',
      '/panel/consultas/c-2',
    );
  });

  it('shows date, goal, regimen and macros of a ready consultation, without a status tag nor the plan name', () => {
    render(<ConsultationsList consultations={[ready]} />);

    const row = item(1);
    expect(within(row).getByText('15/03/2026')).toBeInTheDocument();
    expect(within(row).getByText('Bajar de peso')).toBeInTheDocument();
    expect(within(row).getByText('Hipocalórico')).toBeInTheDocument();
    expect(macro(row, 'Calorías')).toBe('2000 kcal');
    expect(macro(row, 'Proteínas')).toBe('150 g');
    expect(macro(row, 'Carbohidratos')).toBe('200 g');
    expect(macro(row, 'Lípidos')).toBe('60 g');
    expect(within(row).queryByText('Plan personalizado')).not.toBeInTheDocument();
    expect(within(row).queryByText(/Plan listo|Por pagar|Generando|Error/)).not.toBeInTheDocument();
    expect(within(row).queryByRole('link', { name: 'Pagar consulta' })).not.toBeInTheDocument();
  });

  it('tags an unpaid consultation as "Por pagar" and offers to resume the payment', () => {
    render(<ConsultationsList consultations={[pending]} />);

    const row = item(2);
    expect(within(row).getByText('Por pagar')).toBeInTheDocument();
    expect(within(row).getByRole('link', { name: 'Pagar consulta' })).toHaveAttribute('href', '/pago/order-2');
  });

  it.each([
    ['generating', 'Generando'],
    ['error', 'Error'],
  ] as const)('tags a %s consultation', (planStatus, label) => {
    render(<ConsultationsList consultations={[{ ...pending, planStatus }]} />);

    expect(within(item(2)).getByText(label)).toBeInTheDocument();
    expect(within(item(2)).queryByRole('link', { name: 'Pagar consulta' })).not.toBeInTheDocument();
  });

  it('shows a placeholder goal and only the detail link when the consultation has no order', () => {
    render(
      <ConsultationsList consultations={[{ ...pending, planStatus: null, orderId: null, mainGoal: null }]} />,
    );

    const row = item(2);
    expect(within(row).getByText('Sin objetivo registrado')).toBeInTheDocument();
    expect(within(row).getAllByRole('link')).toHaveLength(1);
  });

  it('shows an empty state with a call to start a consultation', () => {
    render(<ConsultationsList consultations={[]} />);

    expect(screen.getByText('Todavía no tienes consultas nutricionales.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Iniciar una consulta' })).toHaveAttribute('href', '/consulta/inicio');
  });

  it('shows date and consultation number instead of an icon, "Consulta nutricional" as title and "Ver detalle"', () => {
    render(<ConsultationsList consultations={[ready]} />);

    const row = item(1);
    const date = within(row).getByText('15/03/2026');
    expect(date.nextElementSibling?.textContent).toBe('Consulta N°1');
    expect(within(row).getByText('Consulta nutricional')).toBeInTheDocument();
    // "Ver detalle" es solo visual: el enlace es todo el card
    expect(within(row).getByText('Ver detalle')).toHaveAttribute('aria-hidden', 'true');
    expect(within(row).getByRole('link', { name: 'Ver consulta N°1' })).toHaveClass('absolute', 'inset-0');
  });

  it('shows "—" for regimen and macros when the consultation has no plan yet', () => {
    render(<ConsultationsList consultations={[pending]} />);

    const row = item(2);
    expect(within(row).getByText((_, el) => el?.tagName === 'P' && el.textContent === 'Régimen: —')).toBeInTheDocument();
    expect(macro(row, 'Calorías')).toBe('—');
  });
});
