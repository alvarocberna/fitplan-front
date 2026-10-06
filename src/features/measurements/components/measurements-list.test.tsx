import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MeasurementsList } from './measurements-list.component';
import type { MeasurementSummaryDto } from '../dtos/measurement.dto';

const selfReported: MeasurementSummaryDto = {
  measurementId: 'm-2',
  measurementNumber: 2,
  measuredAt: '2026-05-10T12:00:00.000Z',
  level: 'BIOIMPEDANCE',
  origin: 'SELF_REPORTED',
  consultationId: null,
  consultationNumber: null,
  weight: 70,
  height: 172,
  bmi: null,
  bmiClassification: null,
  bfKg: 12.6,
  bfPercentage: 18,
  mmKg: null,
  mmPercentage: null,
};

const fromConsultation: MeasurementSummaryDto = {
  ...selfReported,
  measurementId: 'm-1',
  measurementNumber: 1,
  measuredAt: '2026-03-15T12:00:00.000Z',
  level: 'BASIC',
  origin: 'CONSULTATION',
  consultationId: 'c-1',
  consultationNumber: 3,
  weight: 72,
  bmi: 24.34,
  bfPercentage: null,
};

// Valor (<dd>) de la métrica con esa etiqueta; la etiqueta va en un <span> dentro del <dt>.
function metric(row: HTMLElement, label: string): string | null {
  const term = within(row).getByText((_, element) => element?.tagName === 'DT' && element.textContent === label);
  return within(term.parentElement as HTMLElement).getByRole('definition').textContent;
}

describe('MeasurementsList', () => {
  it('offers to register a measurement', () => {
    render(<MeasurementsList measurements={[]} />);

    expect(screen.getByRole('link', { name: 'Registrar medición' })).toHaveAttribute('href', '/mediciones/nueva');
  });

  it('shows an empty state when there are no measurements', () => {
    render(<MeasurementsList measurements={[]} />);

    expect(
      screen.getByText('Todavía no tienes mediciones. Registra la primera para seguir tu progreso.'),
    ).toBeInTheDocument();
  });

  it('renders the title next to "Registrar medición", outside the measurement cards', () => {
    render(<MeasurementsList measurements={[selfReported]} />);

    expect(screen.getByRole('heading', { name: 'Mis mediciones' })).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: 'Medición N°2' })).not.toContainElement(
      screen.getByRole('heading', { name: 'Mis mediciones' }),
    );
  });

  it('renders one card per measurement in the given order, with date, type and weight, BMI and body fat', () => {
    render(<MeasurementsList measurements={[selfReported, fromConsultation]} />);

    const rows = screen.getAllByRole('listitem');
    expect(rows.map((row) => row.getAttribute('aria-label'))).toEqual(['Medición N°2', 'Medición N°1']);

    const first = screen.getByRole('listitem', { name: 'Medición N°2' });
    expect(within(first).getByText('10/05/2026')).toBeInTheDocument();
    expect(within(first).getByText('Bioimpedancia')).toBeInTheDocument();
    expect(metric(first, 'Peso')).toBe('70 kg');
    expect(metric(first, 'IMC')).toBe('—');
    expect(metric(first, '% grasa corporal')).toBe('18 %');

    const second = screen.getByRole('listitem', { name: 'Medición N°1' });
    expect(within(second).getByText('Básica')).toBeInTheDocument();
    expect(metric(second, 'Peso')).toBe('72 kg');
    expect(metric(second, 'IMC')).toBe('24.3');
    expect(metric(second, '% grasa corporal')).toBe('—');
  });

  it('each row links to its detail', () => {
    render(<MeasurementsList measurements={[selfReported]} />);

    expect(screen.getByRole('link', { name: 'Ver medición N°2' })).toHaveAttribute('href', '/mediciones/m-2');
  });
});
