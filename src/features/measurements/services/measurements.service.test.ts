import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MeasurementsService } from './measurements.service';
import {
  getMyMeasurementsAction,
  getMyMeasurementAction,
  recordMeasurementAction,
  updateMeasurementAction,
} from './measurements.actions';

vi.mock('./measurements.actions', () => ({
  getMyMeasurementsAction: vi.fn(),
  getMyMeasurementAction: vi.fn(),
  recordMeasurementAction: vi.fn(),
  updateMeasurementAction: vi.fn(),
}));

const mockedList = vi.mocked(getMyMeasurementsAction);
const mockedGet = vi.mocked(getMyMeasurementAction);
const mockedRecord = vi.mocked(recordMeasurementAction);
const mockedUpdate = vi.mocked(updateMeasurementAction);

const detail = { measurementId: 'm-1' } as any;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MeasurementsService', () => {
  it('getMeasurements returns the unwrapped list and throws the backend message on error', async () => {
    mockedList.mockResolvedValueOnce({ ok: true, data: [] });
    await expect(MeasurementsService.getMeasurements()).resolves.toEqual([]);

    mockedList.mockResolvedValueOnce({ ok: false, message: 'Error del backend' });
    await expect(MeasurementsService.getMeasurements()).rejects.toThrow('Error del backend');
  });

  it('getMeasurement returns the detail, null on 404 and throws on other errors', async () => {
    mockedGet.mockResolvedValueOnce({ ok: true, data: detail });
    await expect(MeasurementsService.getMeasurement('m-1')).resolves.toBe(detail);
    expect(mockedGet).toHaveBeenCalledWith('m-1');

    mockedGet.mockResolvedValueOnce({ ok: false, message: 'Medición no encontrada', status: 404 });
    await expect(MeasurementsService.getMeasurement('m-x')).resolves.toBeNull();

    mockedGet.mockResolvedValueOnce({ ok: false, message: 'Error HTTP 500', status: 500 });
    await expect(MeasurementsService.getMeasurement('m-1')).rejects.toThrow('Error HTTP 500');
  });

  it('recordMeasurement sends the body and returns the created detail', async () => {
    const body = { level: 'BASIC' as const, weight: 70, height: 172 };
    mockedRecord.mockResolvedValue({ ok: true, data: detail });

    await expect(MeasurementsService.recordMeasurement(body)).resolves.toBe(detail);
    expect(mockedRecord).toHaveBeenCalledWith(body);
  });

  it('updateMeasurement sends the id and changes, and throws the backend message on error', async () => {
    mockedUpdate.mockResolvedValueOnce({ ok: true, data: detail });
    await expect(MeasurementsService.updateMeasurement('m-1', { weight: 69 })).resolves.toBe(detail);
    expect(mockedUpdate).toHaveBeenCalledWith('m-1', { weight: 69 });

    mockedUpdate.mockResolvedValueOnce({ ok: false, message: 'Datos inválidos', status: 400 });
    await expect(MeasurementsService.updateMeasurement('m-1', { weight: 1 })).rejects.toThrow('Datos inválidos');
  });
});
