import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PanelService } from './panel.service';
import {
  getPanelSummaryAction,
  getMyConsultationsAction,
  getMyConsultationAction,
  getMyPlansAction,
  getMyPlanAction,
  getMyLatestPlanProjectionAction,
} from './panel.actions';

vi.mock('./panel.actions', () => ({
  getPanelSummaryAction: vi.fn(),
  getMyConsultationsAction: vi.fn(),
  getMyConsultationAction: vi.fn(),
  getMyPlansAction: vi.fn(),
  getMyPlanAction: vi.fn(),
  getMyLatestPlanProjectionAction: vi.fn(),
}));

const mockedGetPanelSummaryAction = vi.mocked(getPanelSummaryAction);
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
  mockedGetPanelSummaryAction.mockReset();
  mockedGetMyConsultationsAction.mockReset();
  mockedGetMyConsultationAction.mockReset();
  mockedGetMyPlansAction.mockReset();
  mockedGetMyPlanAction.mockReset();
  mockedGetMyLatestPlanProjectionAction.mockReset();
});

describe('PanelService', () => {
  it('getSummary returns the unwrapped summary on success', async () => {
    mockedGetPanelSummaryAction.mockResolvedValue({ ok: true, data: summary });

    const result = await PanelService.getSummary();

    expect(mockedGetPanelSummaryAction).toHaveBeenCalledWith();
    expect(result).toEqual(summary);
  });

  it('getSummary throws with the backend message when the action fails', async () => {
    mockedGetPanelSummaryAction.mockResolvedValue({ ok: false, message: 'No se pudo obtener el resumen' });

    await expect(PanelService.getSummary()).rejects.toThrow('No se pudo obtener el resumen');
  });

  it('getConsultations returns the unwrapped list on success', async () => {
    mockedGetMyConsultationsAction.mockResolvedValue({ ok: true, data: consultations });

    await expect(PanelService.getConsultations()).resolves.toEqual(consultations);
    expect(mockedGetMyConsultationsAction).toHaveBeenCalledWith();
  });

  it('getConsultation returns the detail on success', async () => {
    const detail = { consultationId: 'c-1' } as any;
    mockedGetMyConsultationAction.mockResolvedValue({ ok: true, data: detail });

    await expect(PanelService.getConsultation('c-1')).resolves.toBe(detail);
    expect(mockedGetMyConsultationAction).toHaveBeenCalledWith('c-1');
  });

  it('getConsultation returns null when the backend answers 404 (missing or not yours)', async () => {
    mockedGetMyConsultationAction.mockResolvedValue({ ok: false, message: 'Consulta no encontrada', status: 404 });

    await expect(PanelService.getConsultation('c-x')).resolves.toBeNull();
  });

  it('getConsultation throws on any other error', async () => {
    mockedGetMyConsultationAction.mockResolvedValue({ ok: false, message: 'Error HTTP 500', status: 500 });

    await expect(PanelService.getConsultation('c-1')).rejects.toThrow('Error HTTP 500');
  });

  it('getConsultations throws with the backend message when the action fails', async () => {
    mockedGetMyConsultationsAction.mockResolvedValue({ ok: false, message: 'No se pudieron obtener las consultas' });

    await expect(PanelService.getConsultations()).rejects.toThrow('No se pudieron obtener las consultas');
  });

  it('getPlans returns the unwrapped list on success', async () => {
    const plans = [{ orderId: 'order-1' }] as any;
    mockedGetMyPlansAction.mockResolvedValue({ ok: true, data: plans });

    await expect(PanelService.getPlans()).resolves.toBe(plans);
    expect(mockedGetMyPlansAction).toHaveBeenCalledWith();
  });

  it('getPlans throws with the backend message when the action fails', async () => {
    mockedGetMyPlansAction.mockResolvedValue({ ok: false, message: 'No se pudieron obtener los planes' });

    await expect(PanelService.getPlans()).rejects.toThrow('No se pudieron obtener los planes');
  });

  it('getPlan returns the detail on success', async () => {
    const detail = { orderId: 'order-1' } as any;
    mockedGetMyPlanAction.mockResolvedValue({ ok: true, data: detail });

    await expect(PanelService.getPlan('order-1')).resolves.toBe(detail);
    expect(mockedGetMyPlanAction).toHaveBeenCalledWith('order-1');
  });

  it('getPlan returns null when the backend answers 404 (missing, not yours or not ready)', async () => {
    mockedGetMyPlanAction.mockResolvedValue({ ok: false, message: 'Plan no encontrado', status: 404 });

    await expect(PanelService.getPlan('order-x')).resolves.toBeNull();
  });

  it('getPlan throws on any other error', async () => {
    mockedGetMyPlanAction.mockResolvedValue({ ok: false, message: 'Error HTTP 500', status: 500 });

    await expect(PanelService.getPlan('order-1')).rejects.toThrow('Error HTTP 500');
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

    await expect(PanelService.getLatestPlanProjection()).resolves.toBe(latest);
  });

  it('getLatestPlanProjection returns null when the backend answers 404 (no dated plan)', async () => {
    mockedGetMyLatestPlanProjectionAction.mockResolvedValue({ ok: false, message: 'Sin plan', status: 404 });

    await expect(PanelService.getLatestPlanProjection()).resolves.toBeNull();
  });

  it('getLatestPlanProjection throws on any other error', async () => {
    mockedGetMyLatestPlanProjectionAction.mockResolvedValue({ ok: false, message: 'Error HTTP 500', status: 500 });

    await expect(PanelService.getLatestPlanProjection()).rejects.toThrow('Error HTTP 500');
  });
});
