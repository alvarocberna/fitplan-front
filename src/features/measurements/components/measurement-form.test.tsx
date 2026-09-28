import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'react-toastify';
import { MeasurementForm } from './measurement-form.component';
import { MeasurementsService } from '../services/measurements.service';
import type { MeasurementDetailDto } from '../dtos/measurement.dto';

const pushMock = vi.fn();
const refreshMock = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock, refresh: refreshMock }) }));
vi.mock('react-toastify', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('../services/measurements.service', () => ({
  MeasurementsService: { recordMeasurement: vi.fn(), updateMeasurement: vi.fn() },
}));

const mockedRecord = vi.mocked(MeasurementsService.recordMeasurement);
const mockedUpdate = vi.mocked(MeasurementsService.updateMeasurement);

const stored: MeasurementDetailDto = {
  measurementId: 'm-1',
  measurementNumber: 1,
  measuredAt: '2026-03-15T12:00:00.000Z',
  level: 'BIOIMPEDANCE',
  origin: 'SELF_REPORTED',
  consultationId: null,
  consultationNumber: null,
  editable: true,
  raw: { basic: { weight: 72, height: 172 }, skinfolds: null, circumferences: null, diameters: null },
  results: [
    { indicator: 'BODY_FAT_PERCENTAGE', value: 18, unit: '%', classification: null, method: 'BIOIMPEDANCE' },
    { indicator: 'MUSCLE_MASS_KG', value: 32, unit: 'kg', classification: null, method: 'BIOIMPEDANCE' },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MeasurementForm', () => {
  it('registers a basic measurement with weight, height and date, then opens its detail', async () => {
    mockedRecord.mockResolvedValue({ ...stored, measurementId: 'm-new' });
    const user = userEvent.setup();
    render(<MeasurementForm />);

    expect(screen.queryByLabelText('Grasa corporal')).not.toBeInTheDocument();
    await user.clear(screen.getByLabelText('Fecha y hora de la medición'));
    await user.type(screen.getByLabelText('Fecha y hora de la medición'), '2026-05-10T09:30');
    await user.type(screen.getByLabelText('Peso (kg)'), '70');
    await user.type(screen.getByLabelText('Talla (cm)'), '172');
    await user.click(screen.getByRole('button', { name: 'Registrar medición' }));

    await waitFor(() => expect(mockedRecord).toHaveBeenCalled());
    expect(mockedRecord).toHaveBeenCalledWith({
      level: 'BASIC',
      measuredAt: new Date('2026-05-10T09:30').toISOString(),
      weight: 70,
      height: 172,
    });
    expect(pushMock).toHaveBeenCalledWith('/mediciones/m-new');
    expect(refreshMock).toHaveBeenCalled();
  });

  it('asks for body fat and muscle mass (value + unit) in a bioimpedance measurement', async () => {
    mockedRecord.mockResolvedValue(stored);
    const user = userEvent.setup();
    render(<MeasurementForm />);

    await user.selectOptions(screen.getByLabelText('Tipo de medición'), 'BIOIMPEDANCE');
    await user.type(screen.getByLabelText('Peso (kg)'), '70');
    await user.type(screen.getByLabelText('Talla (cm)'), '172');
    await user.type(screen.getByLabelText('Grasa corporal'), '18');
    await user.type(screen.getByLabelText('Masa muscular'), '32');
    const [, muscleUnit] = screen.getAllByLabelText('Unidad');
    await user.selectOptions(muscleUnit, 'KG');
    await user.click(screen.getByRole('button', { name: 'Registrar medición' }));

    await waitFor(() => expect(mockedRecord).toHaveBeenCalled());
    expect(mockedRecord.mock.calls[0][0]).toMatchObject({
      level: 'BIOIMPEDANCE',
      bodyFat: { value: 18, unit: 'PERCENTAGE' },
      muscleMass: { value: 32, unit: 'KG' },
    });
    // grasa visceral y masa ósea vacías: no se envían
    expect(mockedRecord.mock.calls[0][0].visceralFat).toBeUndefined();
    expect(mockedRecord.mock.calls[0][0].boneMass).toBeUndefined();
  });

  it('sends the optional visceral fat and bone mass when filled, each in its own unit', async () => {
    mockedRecord.mockResolvedValue(stored);
    const user = userEvent.setup();
    render(<MeasurementForm />);

    await user.selectOptions(screen.getByLabelText('Tipo de medición'), 'BIOIMPEDANCE');
    await user.type(screen.getByLabelText('Peso (kg)'), '70');
    await user.type(screen.getByLabelText('Talla (cm)'), '172');
    await user.type(screen.getByLabelText('Grasa corporal'), '18');
    await user.type(screen.getByLabelText('Masa muscular'), '40');
    await user.type(screen.getByLabelText('Grasa visceral (opcional)'), '2.1');
    await user.type(screen.getByLabelText('Masa ósea (opcional)'), '4');
    const [, , visceralUnit] = screen.getAllByLabelText('Unidad');
    await user.selectOptions(visceralUnit, 'KG');
    await user.click(screen.getByRole('button', { name: 'Registrar medición' }));

    await waitFor(() => expect(mockedRecord).toHaveBeenCalled());
    expect(mockedRecord.mock.calls[0][0]).toMatchObject({
      visceralFat: { value: 2.1, unit: 'KG' },
      boneMass: { value: 4, unit: 'PERCENTAGE' },
    });
  });

  it('blocks a future date and out-of-range values without calling the backend', async () => {
    const user = userEvent.setup();
    render(<MeasurementForm />);

    await user.clear(screen.getByLabelText('Fecha y hora de la medición'));
    await user.type(screen.getByLabelText('Fecha y hora de la medición'), '2999-01-01T10:00');
    await user.type(screen.getByLabelText('Peso (kg)'), '5');
    await user.type(screen.getByLabelText('Talla (cm)'), '172');
    await user.click(screen.getByRole('button', { name: 'Registrar medición' }));

    expect(await screen.findByText('La fecha no puede ser futura')).toBeInTheDocument();
    expect(screen.getByText('El peso debe estar entre 20 y 300')).toBeInTheDocument();
    expect(mockedRecord).not.toHaveBeenCalled();
  });

  it('in edit mode preloads the stored values, disables the type and sends a PATCH', async () => {
    mockedUpdate.mockResolvedValue(stored);
    const user = userEvent.setup();
    render(<MeasurementForm measurement={stored} />);

    expect(screen.getByLabelText('Tipo de medición')).toBeDisabled();
    expect(screen.getByLabelText('Peso (kg)')).toHaveValue(72);
    expect(screen.getByLabelText('Grasa corporal')).toHaveValue(18);
    expect(screen.getByLabelText('Masa muscular')).toHaveValue(32);

    await user.clear(screen.getByLabelText('Peso (kg)'));
    await user.type(screen.getByLabelText('Peso (kg)'), '70');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(mockedUpdate).toHaveBeenCalled());
    expect(mockedUpdate).toHaveBeenCalledWith('m-1', {
      measuredAt: '2026-03-15T12:00:00.000Z',
      weight: 70,
      height: 172,
      bodyFat: { value: 18, unit: 'PERCENTAGE' },
      muscleMass: { value: 32, unit: 'KG' },
      // opcionales vacíos al editar: null quita lo guardado
      visceralFat: null,
      boneMass: null,
    });
    expect(pushMock).toHaveBeenCalledWith('/mediciones/m-1');
  });

  it('shows the backend error in a toast', async () => {
    mockedUpdate.mockRejectedValue(new Error('Los kg de masa muscular deben ser menores que el peso'));
    const user = userEvent.setup();
    render(<MeasurementForm measurement={stored} />);

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Los kg de masa muscular deben ser menores que el peso'),
    );
    expect(pushMock).not.toHaveBeenCalled();
  });
});
