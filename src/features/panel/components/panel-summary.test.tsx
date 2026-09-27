import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { PanelSummary } from './panel-summary.component';
import type { PanelSummaryDto } from '../dtos/panel-summary.dto';

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
  lastMeasurement: {
    measuredAt: '2026-04-01T12:00:00.000Z',
    weight: 70.5,
    height: 172,
    bmi: 23.83,
    bmiClassification: 'NORMAL_WEIGHT',
    bfPercentage: 18.2,
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
  lastMeasurement: null,
};

// Valor (<dd>) de la fila cuyo <dt> es `label`.
function rowValue(label: string): string | null {
  const row = screen.getByText(label, { selector: 'dt' }).parentElement as HTMLElement;
  return within(row).getByRole('definition').textContent;
}

describe('PanelSummary', () => {
  it('renders one row per field in the "Mi información" card, in order', () => {
    render(<PanelSummary summary={baseSummary} />);

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
      'Fecha última medición',
      'Peso',
      'IMC',
      '% grasa',
    ]);
  });

  it('renders the user info, consultation date, regimen and macros', () => {
    render(<PanelSummary summary={baseSummary} />);

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

  it('renders the last measurement indicators', () => {
    render(<PanelSummary summary={baseSummary} />);

    expect(rowValue('Fecha última medición')).toBe('01/04/2026');
    expect(rowValue('Peso')).toBe('70.5 kg');
    expect(rowValue('IMC')).toBe('23.8 (Normal)');
    expect(rowValue('% grasa')).toBe('18.2 %');
  });

  it('shows placeholders for BMI and body fat when the measurement has no stored results', () => {
    render(
      <PanelSummary
        summary={{
          ...baseSummary,
          lastMeasurement: { ...baseSummary.lastMeasurement!, bmi: null, bmiClassification: null, bfPercentage: null },
        }}
      />,
    );

    expect(rowValue('Peso')).toBe('70.5 kg');
    expect(rowValue('IMC')).toBe('—');
    expect(rowValue('% grasa')).toBe('—');
  });

  it('skips missing name parts when building the full name', () => {
    render(<PanelSummary summary={{ ...baseSummary, middleName: null, maternalLastName: null }} />);

    expect(rowValue('Nombre completo')).toBe('Ana Pérez');
  });

  it('shows placeholders and a call to start a consultation when there is no consultation nor measurement', () => {
    render(<PanelSummary summary={emptySummary} />);

    expect(rowValue('Nombre completo')).toBe('Sin datos');
    expect(rowValue('Edad')).toBe('—');
    expect(rowValue('Fecha última consulta')).toBe('—');
    expect(rowValue('Objetivo')).toBe('Aún no definido');
    expect(rowValue('Régimen')).toBe('—');
    expect(rowValue('Calorías')).toBe('—');
    expect(rowValue('Fecha última medición')).toBe('—');
    expect(rowValue('Peso')).toBe('—');
    expect(rowValue('IMC')).toBe('—');
    expect(screen.getByRole('link', { name: 'Iniciar una consulta' })).toHaveAttribute('href', '/consulta/inicio');
  });

  it('does not show the call to action when there is a consultation', () => {
    render(<PanelSummary summary={{ ...baseSummary, lastMeasurement: null }} />);

    expect(screen.queryByRole('link', { name: 'Iniciar una consulta' })).not.toBeInTheDocument();
  });

  it('shows a placeholder for the regimen when the plan has none', () => {
    render(
      <PanelSummary
        summary={{ ...baseSummary, nutritionalPlan: { ...baseSummary.nutritionalPlan!, dietRegimen: null } }}
      />,
    );

    expect(rowValue('Régimen')).toBe('—');
    expect(rowValue('Calorías')).toBe('2000 kcal');
  });
});
