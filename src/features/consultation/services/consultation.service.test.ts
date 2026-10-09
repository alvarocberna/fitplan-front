import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConsultationService } from './consultation.service';
import {
  createOrderAction,
  startPaymentAction,
  simulatePaymentAction,
  simulatePaymentRejectionAction,
  sendAnamnesisTurnAction,
  getOrderStatusAction,
  evaluateGoalFeasibilityAction,
} from './consultation.actions';
import type { CompleteConsultationDto } from '../dtos/consultation.dto';
import type { InputChatDto } from '../dtos/anamnesis-chat.dto';

vi.mock('./consultation.actions', () => ({
  createOrderAction: vi.fn(),
  startPaymentAction: vi.fn(),
  simulatePaymentAction: vi.fn(),
  simulatePaymentRejectionAction: vi.fn(),
  sendAnamnesisTurnAction: vi.fn(),
  getOrderStatusAction: vi.fn(),
  evaluateGoalFeasibilityAction: vi.fn(),
}));

const mockedCreateOrderAction = vi.mocked(createOrderAction);
const mockedStartPaymentAction = vi.mocked(startPaymentAction);
const mockedSimulatePaymentAction = vi.mocked(simulatePaymentAction);
const mockedSimulatePaymentRejectionAction = vi.mocked(simulatePaymentRejectionAction);
const mockedSendAnamnesisTurnAction = vi.mocked(sendAnamnesisTurnAction);
const mockedGetOrderStatusAction = vi.mocked(getOrderStatusAction);
const mockedEvaluateGoalFeasibilityAction = vi.mocked(evaluateGoalFeasibilityAction);

beforeEach(() => {
  mockedCreateOrderAction.mockReset();
  mockedSimulatePaymentAction.mockReset();
  mockedSimulatePaymentRejectionAction.mockReset();
  mockedSendAnamnesisTurnAction.mockReset();
  mockedGetOrderStatusAction.mockReset();
  mockedEvaluateGoalFeasibilityAction.mockReset();
});

describe('ConsultationService', () => {
  it('evaluateGoalFeasibility sends goals and measurements and returns the evaluation', async () => {
    const evaluation = { feasible: false, goal: 'definicion' as const, message: 'peso bajo' };
    mockedEvaluateGoalFeasibilityAction.mockResolvedValue({ ok: true, data: evaluation });
    const request = {
      goals: { primaryGoal: 'bajar de peso', secondaryGoal: null },
      measurements: { weight: 55, height: 170 },
    };

    await expect(ConsultationService.evaluateGoalFeasibility(request)).resolves.toEqual(evaluation);
    expect(mockedEvaluateGoalFeasibilityAction).toHaveBeenCalledWith(request);
  });

  it('evaluateGoalFeasibility throws the action error message', async () => {
    mockedEvaluateGoalFeasibilityAction.mockResolvedValue({ ok: false, message: 'Sin sesion' } as never);

    await expect(
      ConsultationService.evaluateGoalFeasibility({ goals: null, measurements: { weight: 70, height: 170 } }),
    ).rejects.toThrow('Sin sesion');
  });

  it('createOrder posts the complete consultation to consultations', async () => {
    mockedCreateOrderAction.mockResolvedValue({ ok: true, data: { orderId: 'order-1' } });
    const dto: CompleteConsultationDto = { personalInfo: null, anamnesis: null, measurements: null };

    const result = await ConsultationService.createOrder(dto);

    expect(mockedCreateOrderAction).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ orderId: 'order-1' });
  });

  it('startPayment starts the Webpay payment for the order id and unwraps the form url and token', async () => {
    mockedStartPaymentAction.mockResolvedValue({ ok: true, data: { url: 'https://webpay.test/init', token: 'tok-1' } });

    await expect(ConsultationService.startPayment('order-123')).resolves.toEqual({
      url: 'https://webpay.test/init',
      token: 'tok-1',
    });

    expect(mockedStartPaymentAction).toHaveBeenCalledWith('order-123');
  });

  it('simulatePayment posts the simulated payment for the order id', async () => {
    mockedSimulatePaymentAction.mockResolvedValue({ ok: true, data: { status: 'pagado' } });

    await ConsultationService.simulatePayment('order-123');

    expect(mockedSimulatePaymentAction).toHaveBeenCalledWith('order-123');
  });

  it('simulatePaymentRejection posts the rejection for the order id and unwraps the result', async () => {
    mockedSimulatePaymentRejectionAction.mockResolvedValue({ ok: true, data: { status: 'rejected' } });

    await expect(ConsultationService.simulatePaymentRejection('order-123')).resolves.toEqual({ status: 'rejected' });

    expect(mockedSimulatePaymentRejectionAction).toHaveBeenCalledWith('order-123');
  });

  it('sendAnamnesisTurn posts the chat turn payload to consultations/chat', async () => {
    const input: InputChatDto = { messages: [], anamnesis: { goals: null, clinical: null, dietary: null, lifestyle: null } };
    mockedSendAnamnesisTurnAction.mockResolvedValue({
      ok: true,
      data: { reply: 'hola', titleReply: 'Objetivos', anamnesis: input.anamnesis, isComplete: false },
    });

    await ConsultationService.sendAnamnesisTurn(input);

    expect(mockedSendAnamnesisTurnAction).toHaveBeenCalledWith(input);
  });

  it('getOrderStatus performs a GET against the status endpoint interpolated with the order id', async () => {
    mockedGetOrderStatusAction.mockResolvedValue({
      ok: true,
      data: { paymentStatus: 'PAID', expirationDate: null, generationStatus: 'COMPLETED', planJson: null, pdfUrl: null, thumbnailUrl: null },
    });

    await ConsultationService.getOrderStatus('order-456');

    expect(mockedGetOrderStatusAction).toHaveBeenCalledWith('order-456');
  });
});
