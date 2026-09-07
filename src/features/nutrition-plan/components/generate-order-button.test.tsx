import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'react-toastify';
import { GenerateOrderButton } from './generate-order-button';
import { ConsultationProvider } from '@/shared';
import { ConsultationService } from '@/features';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }) }));
vi.mock('react-toastify', () => ({ toast: { error: vi.fn() } }));
vi.mock('@/features', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features')>();
  return { ...actual, ConsultationService: { createOrder: vi.fn() } };
});

const createOrder = vi.mocked(ConsultationService.createOrder);

const PERSONAL_INFO = { firstName: 'Ana' };
const ANAMNESIS = { goals: null, clinical: null, dietary: null, lifestyle: null };
const MEASUREMENTS = { weight: 70, height: 170, somatotype: 'MESO' };

function seedContext(overrides: Partial<{ personalInfo: unknown; anamnesis: unknown; measurements: unknown }> = {}) {
  localStorage.setItem(
    'consulta_context',
    JSON.stringify({
      personalInfo: PERSONAL_INFO,
      anamnesis: ANAMNESIS,
      measurements: MEASUREMENTS,
      nutritionPlan: null,
      ...overrides,
    })
  );
}

function renderButton() {
  return render(
    <ConsultationProvider>
      <GenerateOrderButton />
    </ConsultationProvider>
  );
}

beforeEach(() => {
  pushMock.mockClear();
  vi.mocked(toast.error).mockClear();
  createOrder.mockReset();
});

describe('GenerateOrderButton', () => {
  it('shows a toast and does not call createOrder when previous-step data is missing', async () => {
    seedContext({ measurements: null });
    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByRole('button'));

    expect(toast.error).toHaveBeenCalledWith('Faltan datos de pasos anteriores');
    expect(createOrder).not.toHaveBeenCalled();
  });

  it('creates the order with the exact consultation payload and navigates to payment', async () => {
    seedContext();
    createOrder.mockResolvedValue({ orderId: 'order-123' });
    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByRole('button'));

    expect(createOrder).toHaveBeenCalledWith({ personalInfo: PERSONAL_INFO, anamnesis: ANAMNESIS, measurements: MEASUREMENTS });
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/payment/order-123'));
  });

  it('shows the error message from a failed createOrder call and re-enables the button', async () => {
    seedContext();
    createOrder.mockRejectedValue(new Error('Servidor caído'));
    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByRole('button'));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Servidor caído'));
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('falls back to a generic error message when the rejection carries none', async () => {
    seedContext();
    createOrder.mockRejectedValue(new Error());
    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByRole('button'));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Error al iniciar la consulta'));
  });
});
