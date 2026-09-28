import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MeasurementDetail } from './measurement-detail.component';
import type { MeasurementDetailDto } from '../dtos/measurement.dto';

const detail: MeasurementDetailDto = {
  measurementId: 'm-1',
  measurementNumber: 1,
  measuredAt: '2026-03-15T12:00:00.000Z',
  level: 'ISAK_1',
  origin: 'CONSULTATION',
  consultationId: 'c-1',
  consultationNumber: 3,
  editable: true,
  raw: {
    basic: { weight: 72, height: 172, armSpan: 175 },
    skinfolds: { triceps: 12 },
    circumferences: null,
    diameters: null,
  },
  results: [
    { indicator: 'BMI', value: 24.3, unit: 'kg/m²', classification: 'NORMAL_WEIGHT', method: null },
    { indicator: 'BODY_FAT_PERCENTAGE', value: 18, unit: '%', classification: null, method: 'BIOIMPEDANCE' },
  ],
};

function rowValue(label: string): string | null {
  const row = screen.getByText(label, { selector: 'dt' }).parentElement as HTMLElement;
  return within(row).getByRole('definition').textContent;
}

describe('MeasurementDetail', () => {
  it('renders the header with number, date, type, origin (linking to the consultation) and the edit button', () => {
    render(<MeasurementDetail measurement={detail} />);

    expect(screen.getByRole('heading', { name: 'Medición N°1' })).toBeInTheDocument();
    expect(screen.getByText(/15\/03\/2026 · ISAK 1 ·/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Consulta N°3' })).toHaveAttribute('href', '/panel/consultas/c-1');
    expect(screen.getByRole('link', { name: 'Editar medición' })).toHaveAttribute('href', '/panel/mediciones/m-1/editar');
    expect(screen.getByRole('link', { name: '← Volver al panel' })).toHaveAttribute('href', '/panel');
  });

  it('renders only the raw sections and fields that have values', () => {
    render(<MeasurementDetail measurement={detail} />);

    expect(screen.getByText('Datos básicos')).toBeInTheDocument();
    expect(rowValue('Peso')).toBe('72 kg');
    expect(rowValue('Envergadura')).toBe('175 cm');
    expect(screen.queryByText('Talla sentado')).not.toBeInTheDocument();
    expect(screen.getByText('Pliegues cutáneos')).toBeInTheDocument();
    expect(rowValue('Tríceps')).toBe('12 mm');
    expect(screen.queryByText('Perímetros')).not.toBeInTheDocument();
    expect(screen.queryByText('Diámetros')).not.toBeInTheDocument();
  });

  it('renders the stored results with their classification and method', () => {
    render(<MeasurementDetail measurement={detail} />);

    expect(rowValue('IMC')).toBe('24.3 kg/m² (Normal)');
    expect(rowValue('Grasa corporal')).toBe('18 % (Bioimpedancia)');
  });

  it('says the interpreted results are coming when there are none, and shows plain origin for self-reported ones', () => {
    render(
      <MeasurementDetail
        measurement={{ ...detail, origin: 'SELF_REPORTED', consultationId: null, consultationNumber: null, results: [] }}
      />,
    );

    expect(screen.getByText('Los resultados interpretados estarán disponibles próximamente.')).toBeInTheDocument();
    expect(screen.getByText(/Registro propio/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Consulta/ })).not.toBeInTheDocument();
  });
});
