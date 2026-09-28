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

function paragraph(container: HTMLElement, text: string) {
  return within(container).getByText((_, element) => element?.tagName === 'P' && element.textContent === text);
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

  it('renders one row per measurement in the given order, with date, type, origin and values', () => {
    render(<MeasurementsList measurements={[selfReported, fromConsultation]} />);

    const rows = screen.getAllByRole('listitem');
    expect(rows).toHaveLength(2);

    const first = screen.getByRole('listitem', { name: 'Medición N°2' });
    expect(within(first).getByText('10/05/2026')).toBeInTheDocument();
    expect(paragraph(first, 'Bioimpedancia · Registro propio')).toBeInTheDocument();
    expect(paragraph(first, 'Peso: 70 kg · IMC: — · % grasa: 18 %')).toBeInTheDocument();

    const second = screen.getByRole('listitem', { name: 'Medición N°1' });
    expect(paragraph(second, 'Básica · Consulta N°3')).toBeInTheDocument();
    expect(paragraph(second, 'Peso: 72 kg · IMC: 24.3 · % grasa: —')).toBeInTheDocument();
  });

  it('each row links to its detail', () => {
    render(<MeasurementsList measurements={[selfReported]} />);

    expect(screen.getByRole('link', { name: 'Ver medición N°2' })).toHaveAttribute('href', '/mediciones/m-2');
  });
});
