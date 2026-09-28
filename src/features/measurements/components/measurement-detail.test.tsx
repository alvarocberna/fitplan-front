import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MeasurementDetail } from './measurement-detail.component';
import type { MeasurementDetailDto } from '../dtos/measurement.dto';

// nivo necesita medidas reales del DOM: stubs que listan lo que recibe cada gráfico.
vi.mock('@nivo/bar', () => ({
  ResponsiveBar: ({ data }: { data: { label: string; kg: number }[] }) => (
    <ul data-testid="bar-stub">
      {data.map(({ label, kg }) => (
        <li key={label}>{`${label}:${kg}`}</li>
      ))}
    </ul>
  ),
}));
vi.mock('@nivo/pie', () => ({
  ResponsivePie: ({ data }: { data: { id: string; value: number }[] }) => (
    <ul data-testid="pie-stub">
      {data.map(({ id, value }) => (
        <li key={id}>{`${id}:${value}`}</li>
      ))}
    </ul>
  ),
}));

const basic: MeasurementDetailDto = {
  measurementId: 'm-1',
  measurementNumber: 1,
  measuredAt: '2026-03-15T12:00:00.000Z',
  level: 'BASIC',
  origin: 'CONSULTATION',
  consultationId: 'c-1',
  consultationNumber: 3,
  editable: true,
  raw: { basic: { weight: 72, height: 172 }, skinfolds: null, circumferences: null, diameters: null },
  results: [{ indicator: 'BMI', value: 24.3, unit: 'kg/m²', classification: 'NORMAL_WEIGHT', method: null }],
};

const bioimpedance: MeasurementDetailDto = {
  ...basic,
  level: 'BIOIMPEDANCE',
  raw: { basic: { weight: 80, height: 172 }, skinfolds: null, circumferences: null, diameters: null },
  results: [
    { indicator: 'BMI', value: 27.04, unit: 'kg/m²', classification: 'OVERWEIGHT', method: null },
    { indicator: 'BODY_FAT_PERCENTAGE', value: 22, unit: '%', classification: null, method: 'BIOIMPEDANCE' },
    { indicator: 'BODY_FAT_KG', value: 17.6, unit: 'kg', classification: null, method: 'BIOIMPEDANCE' },
    { indicator: 'MUSCLE_MASS_PERCENTAGE', value: 40, unit: '%', classification: null, method: 'BIOIMPEDANCE' },
    { indicator: 'MUSCLE_MASS_KG', value: 32, unit: 'kg', classification: null, method: 'BIOIMPEDANCE' },
    { indicator: 'VISCERAL_FAT_KG', value: 4, unit: 'kg', classification: null, method: 'BIOIMPEDANCE' },
    { indicator: 'VISCERAL_FAT_PERCENTAGE', value: 5, unit: '%', classification: null, method: 'BIOIMPEDANCE' },
  ],
};

function stat(label: string): string | null {
  const box = screen.getByText(label, { selector: 'dt' }).parentElement as HTMLElement;
  return within(box)
    .getAllByRole('definition')
    .map((dd) => dd.textContent)
    .join(' | ');
}

function items(testId: string): (string | null)[] {
  return within(screen.getByTestId(testId))
    .getAllByRole('listitem')
    .map((item) => item.textContent);
}

describe('MeasurementDetail', () => {
  it('renders the header with number, date, type, origin (linking to the consultation) and the edit button', () => {
    render(<MeasurementDetail measurement={basic} />);

    expect(screen.getByRole('heading', { name: 'Medición N°1' })).toBeInTheDocument();
    expect(screen.getByText(/15\/03\/2026 · Básica ·/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Consulta N°3' })).toHaveAttribute('href', '/panel/consultas/c-1');
    expect(screen.getByRole('link', { name: 'Editar medición' })).toHaveAttribute('href', '/mediciones/m-1/editar');
    expect(screen.getByRole('link', { name: '← Volver a mis mediciones' })).toHaveAttribute('href', '/mediciones');
  });

  it('shows weight, height and BMI with its classification plus the BMI scale', () => {
    render(<MeasurementDetail measurement={basic} />);

    expect(screen.getByText('Peso e IMC')).toBeInTheDocument();
    expect(stat('Peso')).toBe('72 kg');
    expect(stat('Talla')).toBe('172 cm');
    expect(stat('IMC')).toBe('24.3 | Normal');
    expect(screen.getByRole('img', { name: 'IMC 24.3, normal' })).toBeInTheDocument();
  });

  it('a basic measurement has no body composition nor other measurements', () => {
    render(<MeasurementDetail measurement={basic} />);

    expect(screen.queryByText('Composición corporal')).not.toBeInTheDocument();
    expect(screen.queryByText('Otras mediciones')).not.toBeInTheDocument();
  });

  it('a bioimpedance shows the kg bars (all components) and the % pie (without visceral fat, plus "Resto")', () => {
    render(<MeasurementDetail measurement={bioimpedance} />);

    expect(screen.getByText('Composición corporal')).toBeInTheDocument();
    expect(items('bar-stub')).toEqual(['Grasa corporal:17.6', 'Masa muscular:32', 'Grasa visceral:4']);
    expect(items('pie-stub')).toEqual(['bodyFat:22', 'muscleMass:40', 'rest:38']);
    const fatRow = screen.getByText('Grasa corporal', { selector: 'dt' }).parentElement as HTMLElement;
    expect(within(fatRow).getByRole('definition').textContent).toBe('17.6 kg · 22 % (Bioimpedancia)');
    expect(screen.getByRole('img', { name: 'IMC 27.04, sobrepeso' })).toBeInTheDocument();
  });

  it('groups skinfolds and the remaining basic data under "Otras mediciones"', () => {
    render(
      <MeasurementDetail
        measurement={{
          ...basic,
          level: 'ISAK_1',
          raw: { basic: { weight: 72, height: 172, armSpan: 175 }, skinfolds: { triceps: 12 }, circumferences: null, diameters: null },
        }}
      />,
    );

    expect(screen.getByText('Otras mediciones')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pliegues cutáneos' })).toBeInTheDocument();
    const triceps = screen.getByText('Tríceps', { selector: 'dt' }).parentElement as HTMLElement;
    expect(within(triceps).getByRole('definition').textContent).toBe('12 mm');
    expect(screen.getByText('Envergadura', { selector: 'dt' })).toBeInTheDocument();
  });

  it('without BMI says the results are coming, and shows plain origin for self-reported ones', () => {
    render(
      <MeasurementDetail
        measurement={{
          ...basic,
          origin: 'SELF_REPORTED',
          consultationId: null,
          consultationNumber: null,
          raw: { basic: null, skinfolds: null, circumferences: null, diameters: null },
          results: [],
        }}
      />,
    );

    expect(screen.getByText('Los resultados interpretados estarán disponibles próximamente.')).toBeInTheDocument();
    expect(stat('Peso')).toBe('—');
    expect(screen.getByText(/Registro propio/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Consulta/ })).not.toBeInTheDocument();
  });
});
