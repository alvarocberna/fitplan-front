import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardService } from './dashboard.service';
import {
  getDashboardSummaryAction,
  getMyConsultationsAction,
  getMyConsultationAction,
  getMyPlansAction,
  getMyPlanAction,
  getMyLatestPlanProjectionAction,
} from './dashboard.actions';

vi.mock('./dashboard.actions', () => ({
  getDashboardSummaryAction: vi.fn(),
  getMyConsultationsAction: vi.fn(),
  getMyConsultationAction: vi.fn(),
  getMyPlansAction: vi.fn(),
  getMyPlanAction: vi.fn(),
  getMyLatestPlanProjectionAction: vi.fn(),
}));

const mockedGetDashboardSummaryAction = vi.mocked(getDashboardSummaryAction);
const mockedGetMyConsultationsAction = vi.mocked(getMyConsultationsAction);
const mockedGetMyConsultationAction = vi.mocked(getMyConsultationAction);
const mockedGetMyPlansAction = vi.mocked(getMyPlansAction);
const mockedGetMyPlanAction = vi.mocked(getMyPlanAction);
const mockedGetMyLatestPlanProjectionAction = vi.mocked(getMyLatestPlanProjectionAction);

const summary = {
  firstName: 'Ana',
  middleName: null,
  paternalLastName: 'Pérez',
  maternalLastName: null,
  age: 34,
  lastConsultationDate: null,
  goal: 'Bajar de peso',
  nutritionalPlan: null,
  lastMeasurement: null,
};

const consultations = [
  {
    consultationId: 'c-1',
    consultationNumber: 1,
    consultationDate: '2026-03-15T12:00:00.000Z',
    mainGoal: 'Bajar de peso',
    planStatus: 'awaiting_payment' as const,
    orderId: 'order-1',
    plan: null,
  },
];

beforeEach(() => {
  mockedGetDashboardSummaryAction.mockReset();
  mockedGetMyConsultationsAction.mockReset();
  mockedGetMyConsultationAction.mockReset();
  mockedGetMyPlansAction.mockReset();
  mockedGetMyPlanAction.mockReset();
  mockedGetMyLatestPlanProjectionAction.mockReset();
});

describe('DashboardService', () => {
  it('getSummary returns the unwrapped summary on success', async () => {
    mockedGetDashboardSummaryAction.mockResolvedValue({ ok: true, data: summary });

    const result = await DashboardService.getSummary();

    expect(mockedGetDashboardSummaryAction).toHaveBeenCalledWith();
    expect(result).toEqual(summary);
  });

  it('getSummary throws with the backend message when the action fails', async () => {
    mockedGetDashboardSummaryAction.mockResolvedValue({ ok: false, message: 'No se pudo obtener el resumen' });

    await expect(DashboardService.getSummary()).rejects.toThrow('No se pudo obtener el resumen');
  });

  it('getConsultations returns the unwrapped list on success', async () => {
    mockedGetMyConsultationsAction.mockResolvedValue({ ok: true, data: consultations });

    await expect(DashboardService.getConsultations()).resolves.toEqual(consultations);
    expect(mockedGetMyConsultationsAction).toHaveBeenCalledWith();
  });

  it('getConsultation returns the detail on success', async () => {
    const detail = { consultationId: 'c-1' } as any;
    mockedGetMyConsultationAction.mockResolvedValue({ ok: true, data: detail });

    await expect(DashboardService.getConsultation('c-1')).resolves.toBe(detail);
    expect(mockedGetMyConsultationAction).toHaveBeenCalledWith('c-1');
  });

  it('getConsultation returns null when the backend answers 404 (missing or not yours)', async () => {
    mockedGetMyConsultationAction.mockResolvedValue({ ok: false, message: 'Consulta no encontrada', status: 404 });

    await expect(DashboardService.getConsultation('c-x')).resolves.toBeNull();
  });

  it('getConsultation throws on any other error', async () => {
    mockedGetMyConsultationAction.mockResolvedValue({ ok: false, message: 'Error HTTP 500', status: 500 });

    await expect(DashboardService.getConsultation('c-1')).rejects.toThrow('Error HTTP 500');
  });

  it('getConsultations throws with the backend message when the action fails', async () => {
    mockedGetMyConsultationsAction.mockResolvedValue({ ok: false, message: 'No se pudieron obtener las consultas' });

    await expect(DashboardService.getConsultations()).rejects.toThrow('No se pudieron obtener las consultas');
  });

  it('getPlans returns the unwrapped list on success', async () => {
    const plans = [{ orderId: 'order-1' }] as any;
    mockedGetMyPlansAction.mockResolvedValue({ ok: true, data: plans });

    await expect(DashboardService.getPlans()).resolves.toBe(plans);
    expect(mockedGetMyPlansAction).toHaveBeenCalledWith();
  });

  it('getPlans throws with the backend message when the action fails', async () => {
    mockedGetMyPlansAction.mockResolvedValue({ ok: false, message: 'No se pudieron obtener los planes' });

    await expect(DashboardService.getPlans()).rejects.toThrow('No se pudieron obtener los planes');
  });

  it('getPlan returns the detail on success', async () => {
    const detail = { orderId: 'order-1' } as any;
    mockedGetMyPlanAction.mockResolvedValue({ ok: true, data: detail });

    await expect(DashboardService.getPlan('order-1')).resolves.toBe(detail);
    expect(mockedGetMyPlanAction).toHaveBeenCalledWith('order-1');
  });

  it('getPlan returns null when the backend answers 404 (missing, not yours or not ready)', async () => {
    mockedGetMyPlanAction.mockResolvedValue({ ok: false, message: 'Plan no encontrado', status: 404 });

    await expect(DashboardService.getPlan('order-x')).resolves.toBeNull();
  });

  it('getPlan throws on any other error', async () => {
    mockedGetMyPlanAction.mockResolvedValue({ ok: false, message: 'Error HTTP 500', status: 500 });

    await expect(DashboardService.getPlan('order-1')).rejects.toThrow('Error HTTP 500');
  });

  it('getLatestPlanProjection returns the period and projection on success', async () => {
    const latest = {
      orderId: 'order-1',
      planName: 'Plan personalizado',
      startDate: '2026-09-27',
      endDate: '2026-12-27',
      projection: null,
    };
    mockedGetMyLatestPlanProjectionAction.mockResolvedValue({ ok: true, data: latest });

    await expect(DashboardService.getLatestPlanProjection()).resolves.toBe(latest);
  });

  it('getLatestPlanProjection returns null when the backend answers 404 (no dated plan)', async () => {
    mockedGetMyLatestPlanProjectionAction.mockResolvedValue({ ok: false, message: 'Sin plan', status: 404 });

    await expect(DashboardService.getLatestPlanProjection()).resolves.toBeNull();
  });

  it('getLatestPlanProjection throws on any other error', async () => {
    mockedGetMyLatestPlanProjectionAction.mockResolvedValue({ ok: false, message: 'Error HTTP 500', status: 500 });

    await expect(DashboardService.getLatestPlanProjection()).rejects.toThrow('Error HTTP 500');
  });
});
