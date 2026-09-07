import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConsultationService } from './consultation.service';
import { apiFetch } from '../../../shared/api/client';
import type { CompleteConsultationDto } from '../dtos/consultation.dto';
import type { InputChatDto } from '../dtos/anamnesis-chat.dto';

vi.mock('../../../shared/api/client', () => ({ apiFetch: vi.fn() }));

const mockedApiFetch = vi.mocked(apiFetch);

beforeEach(() => {
  mockedApiFetch.mockReset();
});

describe('ConsultationService', () => {
  it('createOrder posts the complete consultation to ordenes/crear', async () => {
    mockedApiFetch.mockResolvedValue({ orderId: 'order-1' });
    const dto: CompleteConsultationDto = { personalInfo: null, anamnesis: null, measurements: null };

    const result = await ConsultationService.createOrder(dto);

    expect(mockedApiFetch).toHaveBeenCalledWith('ordenes/crear', 'POST', dto);
    expect(result).toEqual({ orderId: 'order-1' });
  });

  it('simulatePayment posts to the webhook endpoint interpolated with the order id', async () => {
    mockedApiFetch.mockResolvedValue({ status: 'pagado' });

    await ConsultationService.simulatePayment('order-123');

    expect(mockedApiFetch).toHaveBeenCalledWith('webhooks/ordenes/order-123/simular-pago', 'POST');
  });

  it('sendAnamnesisTurn posts the chat turn payload to consulta/chat', async () => {
    const input: InputChatDto = { messages: [], anamnesis: { goals: null, clinical: null, dietary: null, lifestyle: null } };
    mockedApiFetch.mockResolvedValue({
      reply: 'hola', titleReply: 'Objetivos', anamnesis: input.anamnesis, isComplete: false,
    });

    await ConsultationService.sendAnamnesisTurn(input);

    expect(mockedApiFetch).toHaveBeenCalledWith('consulta/chat', 'POST', input);
  });

  it('getOrderStatus performs a GET against the status endpoint interpolated with the order id', async () => {
    mockedApiFetch.mockResolvedValue({ paymentStatus: 'pagado', generationStatus: 'completado', planJson: null });

    await ConsultationService.getOrderStatus('order-456');

    expect(mockedApiFetch).toHaveBeenCalledWith('ordenes/obtener-estado/order-456', 'GET');
  });
});
