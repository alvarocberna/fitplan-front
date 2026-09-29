import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { PersonalInfoCard } from './personal-info-card.component';
import type { DashboardSummaryDto } from '../dtos/dashboard-summary.dto';

const summary: DashboardSummaryDto = {
  firstName: 'Ana',
  middleName: 'María',
  paternalLastName: 'Pérez',
  maternalLastName: null,
  age: 34,
  lastConsultationDate: null,
  goal: null,
  nutritionalPlan: null,
  lastMeasurement: null,
};

function value(label: string): string | null {
  const term = screen.getByText(label, { selector: 'dt' });
  return within(term.parentElement as HTMLElement).getByRole('definition').textContent;
}

describe('PersonalInfoCard', () => {
  it('shows the title with the full name and age', () => {
    render(<PersonalInfoCard summary={summary} />);

    const card = screen.getByRole('region', { name: 'Información personal' });
    expect(within(card).getByRole('heading', { name: 'Información personal' })).toBeInTheDocument();
    expect(value('Nombre')).toBe('Ana María Pérez');
    expect(value('Edad')).toBe('34 años');
    // nombre y edad en la misma fila (grilla de 2 columnas)
    const nameGroup = screen.getByText('Nombre', { selector: 'dt' }).parentElement as HTMLElement;
    const ageGroup = screen.getByText('Edad', { selector: 'dt' }).parentElement as HTMLElement;
    expect(nameGroup.parentElement).toBe(ageGroup.parentElement);
    expect(nameGroup.parentElement).toHaveClass('grid-cols-2');
  });

  it('shows placeholders when the profile has no name or age', () => {
    render(
      <PersonalInfoCard
        summary={{ ...summary, firstName: null, middleName: null, paternalLastName: null, age: null }}
      />,
    );

    expect(value('Nombre')).toBe('Sin datos');
    expect(value('Edad')).toBe('—');
  });
});
