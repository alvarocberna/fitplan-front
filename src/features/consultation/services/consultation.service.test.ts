import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConsultationService } from './consultation.service';
import {
  createOrderAction,
  simulatePaymentAction,
  sendAnamnesisTurnAction,
  getOrderStatusAction,
} from './consultation.actions';
import type { CompleteConsultationDto } from '../dtos/consultation.dto';
import type { InputChatDto } from '../dtos/anamnesis-chat.dto';

vi.mock('./consultation.actions', () => ({
  createOrderAction: vi.fn(),
  simulatePaymentAction: vi.fn(),
  sendAnamnesisTurnAction: vi.fn(),
  getOrderStatusAction: vi.fn(),
}));

const mockedCreateOrderAction = vi.mocked(createOrderAction);
const mockedSimulatePaymentAction = vi.mocked(simulatePaymentAction);
const mockedSendAnamnesisTurnAction = vi.mocked(sendAnamnesisTurnAction);
const mockedGetOrderStatusAction = vi.mocked(getOrderStatusAction);

beforeEach(() => {
  mockedCreateOrderAction.mockReset();
  mockedSimulatePaymentAction.mockReset();
  mockedSendAnamnesisTurnAction.mockReset();
  mockedGetOrderStatusAction.mockReset();
});

describe('ConsultationService', () => {
  it('createOrder posts the complete consultation to consultations', async () => {
    mockedCreateOrderAction.mockResolvedValue({ ok: true, data: { orderId: 'order-1' } });
    const dto: CompleteConsultationDto = { personalInfo: null, anamnesis: null, measurements: null };

    const result = await ConsultationService.createOrder(dto);

    expect(mockedCreateOrderAction).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ orderId: 'order-1' });
  });

  it('simulatePayment posts to the webhook endpoint interpolated with the order id', async () => {
    mockedSimulatePaymentAction.mockResolvedValue({ ok: true, data: { status: 'pagado' } });

    await ConsultationService.simulatePayment('order-123');

    expect(mockedSimulatePaymentAction).toHaveBeenCalledWith('order-123');
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
      data: { paymentStatus: 'PAID', generationStatus: 'COMPLETED', planJson: null, pdfUrl: null, thumbnailUrl: null },
    });

    await ConsultationService.getOrderStatus('order-456');

    expect(mockedGetOrderStatusAction).toHaveBeenCalledWith('order-456');
  });
});
