import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'react-toastify';
import SimulatedPaymentPage from '@/app/(sesion)/pago/[orderId]/page';
import { ConsultationService } from '@/features';
import { PlanSelectionProvider } from '@/shared';

const pushMock = vi.fn();
let searchParams = new URLSearchParams();
vi.mock('next/navigation', () => ({
  useParams: () => ({ orderId: 'order-1' }),
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => searchParams,
}));
vi.mock('react-toastify', () => ({ toast: { error: vi.fn() } }));
vi.mock('@/features', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features')>();
  return { ...actual, ConsultationService: { simulatePayment: vi.fn() } };
});

const simulatePayment = vi.mocked(ConsultationService.simulatePayment);

function renderPage() {
  return render(
    <PlanSelectionProvider>
      <SimulatedPaymentPage />
    </PlanSelectionProvider>
  );
}

beforeEach(() => {
  searchParams = new URLSearchParams();
  pushMock.mockClear();
  vi.mocked(toast.error).mockClear();
  simulatePayment.mockReset();
});

describe('SimulatedPaymentPage (/pago/[orderId])', () => {
  it('plan personalizado (sin ?tipo): tras pagar va a /ordenes/<id>, donde se espera la generación del plan', async () => {
    simulatePayment.mockResolvedValue({ status: 'procesado' });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Pagar' }));

    expect(simulatePayment).toHaveBeenCalledWith('order-1');
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/ordenes/order-1'));
  });

  it('plan predefinido (?tipo=predefinido): tras pagar vacía el carro y va a /panel', async () => {
    searchParams = new URLSearchParams('tipo=predefinido');
    localStorage.setItem(
      'plan_selection',
      JSON.stringify({ selection: {}, cartItem: { planSlug: 'plan-gimnasio-volumen', code: 'plan-gimnasio-volumen-50-60-m-joven' } })
    );
    simulatePayment.mockResolvedValue({ status: 'procesado' });
    const user = userEvent.setup();
    renderPage();
    //espera a que el proveedor se hidrate desde localStorage antes de pagar
    await waitFor(() => expect(screen.getByRole('button', { name: 'Pagar' })).toBeEnabled());

    await user.click(screen.getByRole('button', { name: 'Pagar' }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/panel'));
    expect(pushMock).not.toHaveBeenCalledWith('/ordenes/order-1');
    expect(JSON.parse(localStorage.getItem('plan_selection')!).cartItem).toBeNull();
  });

  it('un ?tipo desconocido se trata como plan personalizado', async () => {
    searchParams = new URLSearchParams('tipo=otro');
    simulatePayment.mockResolvedValue({ status: 'procesado' });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Pagar' }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/ordenes/order-1'));
  });

  it('si el pago falla muestra un toast, no navega y permite reintentar', async () => {
    searchParams = new URLSearchParams('tipo=predefinido');
    simulatePayment.mockRejectedValue(new Error('Error al procesar el pago'));
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Pagar' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Error al procesar el pago'));
    expect(pushMock).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Pagar' })).toBeEnabled();
  });
});
