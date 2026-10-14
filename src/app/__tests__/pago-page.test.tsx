import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'react-toastify';
import PaymentPage from '@/app/(sesion)/pago/[orderId]/page';
import { ConsultationService } from '@/features';
import type { OrderStatusDto } from '@/features';
import { PlanSelectionProvider, ActionError, SessionRequiredError } from '@/shared';

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
  return {
    ...actual,
    ConsultationService: { startPayment: vi.fn(), simulatePayment: vi.fn(), simulatePaymentRejection: vi.fn(), getOrderStatus: vi.fn() },
  };
});

const startPayment = vi.mocked(ConsultationService.startPayment);
const simulatePayment = vi.mocked(ConsultationService.simulatePayment);
const simulatePaymentRejection = vi.mocked(ConsultationService.simulatePaymentRejection);
const getOrderStatus = vi.mocked(ConsultationService.getOrderStatus);

function orderStatus(paymentStatus: OrderStatusDto['paymentStatus']): OrderStatusDto {
  return {
    paymentStatus,
    expirationDate: '2026-01-02T00:00:00.000Z',
    generationStatus: 'NOT_STARTED',
    planJson: null,
    pdfUrl: null,
    thumbnailUrl: null,
  };
}

function renderPage() {
  return render(
    <PlanSelectionProvider>
      <PaymentPage />
    </PlanSelectionProvider>
  );
}

beforeEach(() => {
  searchParams = new URLSearchParams();
  pushMock.mockClear();
  vi.mocked(toast.error).mockClear();
  startPayment.mockReset();
  simulatePayment.mockReset();
  simulatePaymentRejection.mockReset();
  getOrderStatus.mockReset();
  getOrderStatus.mockResolvedValue(orderStatus('PENDING'));
});

describe('PaymentPage (/pago/[orderId])', () => {
  it('plan personalizado (sin ?tipo): tras pagar va a /ordenes/<id>, donde se espera la generación del plan', async () => {
    simulatePayment.mockResolvedValue({ status: 'processed' });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Simular pago' }));

    expect(simulatePayment).toHaveBeenCalledWith('order-1');
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/ordenes/order-1'));
  });

  it('plan predefinido (?tipo=predefinido): tras pagar vacía el carro y va a /inicio', async () => {
    searchParams = new URLSearchParams('tipo=predefinido');
    localStorage.setItem(
      'plan_selection',
      JSON.stringify({ selection: {}, cartItem: { planSlug: 'plan-gimnasio-volumen', code: 'plan-gimnasio-volumen-50-60-m-joven' } })
    );
    simulatePayment.mockResolvedValue({ status: 'processed' });
    const user = userEvent.setup();
    renderPage();
    //espera a que el proveedor se hidrate desde localStorage antes de pagar
    await waitFor(() => expect(screen.getByRole('button', { name: 'Simular pago' })).toBeEnabled());

    await user.click(screen.getByRole('button', { name: 'Simular pago' }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/inicio'));
    expect(pushMock).not.toHaveBeenCalledWith('/ordenes/order-1');
    expect(JSON.parse(localStorage.getItem('plan_selection')!).cartItem).toBeNull();
  });

  it('un ?tipo desconocido se trata como plan personalizado', async () => {
    searchParams = new URLSearchParams('tipo=otro');
    simulatePayment.mockResolvedValue({ status: 'processed' });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Simular pago' }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/ordenes/order-1'));
  });

  it('si el pago falla muestra un toast, no navega y permite reintentar', async () => {
    searchParams = new URLSearchParams('tipo=predefinido');
    simulatePayment.mockRejectedValue(new Error('Error al procesar el pago'));
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Simular pago' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Error al procesar el pago', expect.anything()));
    expect(pushMock).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Simular pago' })).toBeEnabled();
  });

  it('si no se puede leer el estado de la orden, igual deja pagar', async () => {
    getOrderStatus.mockRejectedValue(new Error('network blip'));
    simulatePayment.mockResolvedValue({ status: 'processed' });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Simular pago' }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/ordenes/order-1'));
  });

  it('orden expirada: no ofrece pagar y enlaza a una nueva consulta', async () => {
    getOrderStatus.mockResolvedValue(orderStatus('EXPIRED'));
    renderPage();

    expect(await screen.findByText('Esta orden expiró')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Simular pago' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Iniciar una nueva consulta' })).toHaveAttribute(
      'href',
      '/consulta/anamnesis'
    );
  });

  it('orden expirada de un plan predefinido: enlaza al catálogo de planes', async () => {
    searchParams = new URLSearchParams('tipo=predefinido');
    getOrderStatus.mockResolvedValue(orderStatus('EXPIRED'));
    renderPage();

    expect(await screen.findByRole('link', { name: 'Ver planes' })).toHaveAttribute('href', '/planes-estandar');
  });

  it('orden con el pago rechazado: avisa y permite reintentar', async () => {
    getOrderStatus.mockResolvedValue(orderStatus('REJECTED'));
    simulatePayment.mockResolvedValue({ status: 'processed' });
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Tu pago fue rechazado');

    await user.click(screen.getByRole('button', { name: 'Simular pago' }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/ordenes/order-1'));
  });

  it('orden ya pagada: no vuelve a cobrar y va a /ordenes/<id>', async () => {
    getOrderStatus.mockResolvedValue(orderStatus('PAID'));
    renderPage();

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/ordenes/order-1'));
    expect(simulatePayment).not.toHaveBeenCalled();
  });

  it('"Simular rechazo" deja la orden rechazada, sin navegar, y permite reintentar', async () => {
    simulatePaymentRejection.mockResolvedValue({ status: 'rejected' });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Simular rechazo' }));

    expect(simulatePaymentRejection).toHaveBeenCalledWith('order-1');
    expect(await screen.findByRole('alert')).toHaveTextContent('Tu pago fue rechazado');
    expect(pushMock).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Simular pago' })).toBeEnabled();
  });

  it('si la orden expiró mientras la página estaba abierta, al pagar muestra el estado expirado', async () => {
    getOrderStatus.mockResolvedValueOnce(orderStatus('PENDING')).mockResolvedValue(orderStatus('EXPIRED'));
    simulatePayment.mockRejectedValue(new Error('La orden order-1 expiró sin pagarse'));
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Simular pago' }));

    expect(await screen.findByText('Esta orden expiró')).toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('orden inexistente o ajena (404 al leer el estado): muestra "Orden no encontrada" y no ofrece pagar', async () => {
    getOrderStatus.mockRejectedValue(new ActionError('Orden no encontrada', 404, 'NOT_FOUND'));
    renderPage();

    expect(await screen.findByText('Orden no encontrada')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Simular pago' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/inicio');
  });

  describe('pago con Webpay', () => {
    let submitMock: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      //jsdom no implementa la navegación de un formulario
      submitMock = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {});
    });

    it('"Pagar con Webpay" inicia el pago y envía el token al formulario de Webpay por POST', async () => {
      startPayment.mockResolvedValue({ url: 'https://webpay3gint.transbank.cl/webpayserver/initTransaction', token: 'tok-1' });
      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByRole('button', { name: 'Pagar con Webpay' }));

      expect(startPayment).toHaveBeenCalledWith('order-1');
      await waitFor(() => expect(submitMock).toHaveBeenCalledTimes(1));
      const form = submitMock.mock.contexts[0] as HTMLFormElement;
      expect(form.method).toBe('post');
      expect(form.action).toBe('https://webpay3gint.transbank.cl/webpayserver/initTransaction');
      expect(new FormData(form).get('token_ws')).toBe('tok-1');
      //no navega dentro de la app: el navegador sale hacia Webpay
      expect(pushMock).not.toHaveBeenCalled();
      expect(simulatePayment).not.toHaveBeenCalled();
    });

    it('si no se puede iniciar el pago muestra el error del backend y permite reintentar', async () => {
      startPayment.mockRejectedValue(new ActionError('No pudimos conectar con el medio de pago', 503, 'PAYMENT_UNAVAILABLE'));
      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByRole('button', { name: 'Pagar con Webpay' }));

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('No pudimos conectar con el medio de pago', expect.anything()),
      );
      expect(submitMock).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: 'Pagar con Webpay' })).toBeEnabled();
    });

    it('si la orden ya estaba pagada al intentar pagar, sigue a la orden sin mostrar un error', async () => {
      getOrderStatus.mockResolvedValueOnce(orderStatus('PENDING')).mockResolvedValue(orderStatus('PAID'));
      startPayment.mockRejectedValue(new ActionError('Esta orden ya está pagada', 409, 'ORDER_ALREADY_PAID'));
      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByRole('button', { name: 'Pagar con Webpay' }));

      await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/ordenes/order-1'));
      expect(toast.error).not.toHaveBeenCalled();
    });

    it.each([
      ['anulado', 'Anulaste el pago en Webpay'],
      ['no_cobrado', 'no confirmamos el cobro'],
      ['revision', 'Lo estamos revisando'],
    ])('al volver de Webpay con ?resultado=%s muestra su aviso', async (resultado, text) => {
      searchParams = new URLSearchParams(`resultado=${resultado}`);
      renderPage();

      expect(await screen.findByRole('alert')).toHaveTextContent(text);
    });

    it('un ?resultado desconocido no muestra ningún aviso', async () => {
      searchParams = new URLSearchParams('resultado=<b>hola</b>');
      renderPage();

      await waitFor(() => expect(getOrderStatus).toHaveBeenCalled());
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('sin NEXT_PUBLIC_ENABLE_PAYMENT_SIMULATION no muestra los botones de pago simulado', async () => {
      vi.stubEnv('NEXT_PUBLIC_ENABLE_PAYMENT_SIMULATION', '');
      vi.resetModules();
      const { default: PageWithoutSimulation } = await import('@/app/(sesion)/pago/[orderId]/page');
      const { PlanSelectionProvider: Provider } = await import('@/shared');
      render(
        <Provider>
          <PageWithoutSimulation />
        </Provider>
      );

      expect(await screen.findByRole('button', { name: 'Pagar con Webpay' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Simular pago' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Simular rechazo' })).not.toBeInTheDocument();
      vi.unstubAllEnvs();
      vi.resetModules();
    });

    it('sin NEXT_PUBLIC_WEBPAY_ENABLED avisa que Webpay aún no está validado y no deja pagar', async () => {
      vi.stubEnv('NEXT_PUBLIC_WEBPAY_ENABLED', '');
      vi.resetModules();
      const { default: PageWithoutWebpay } = await import('@/app/(sesion)/pago/[orderId]/page');
      const { PlanSelectionProvider: Provider } = await import('@/shared');
      render(
        <Provider>
          <PageWithoutWebpay />
        </Provider>
      );

      expect(await screen.findByRole('status')).toHaveTextContent('El pago con Webpay aún no está validado');
      expect(screen.getByRole('button', { name: 'Pagar con Webpay' })).toBeDisabled();
      vi.unstubAllEnvs();
      vi.resetModules();
    });
  });

  it('sesión vencida al pagar: lleva a iniciar sesión en vez de mostrar un toast', async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign });
    simulatePayment.mockRejectedValue(new SessionRequiredError('Tu sesión expiró'));
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Simular pago' }));

    await waitFor(() => expect(assign).toHaveBeenCalledWith('/login?error=session_expired'));
    expect(toast.error).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
