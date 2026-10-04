import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import OrderPage from '@/app/(sesion)/ordenes/[id]/page';
import { ConsultationProvider, ActionError, SessionRequiredError } from '@/shared';
import { ConsultationService } from '@/features';
import type { OrderStatusDto } from '@/features';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'order-1' }),
  usePathname: () => '/ordenes/order-1',
}));
vi.mock('@/features', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features')>();
  return { ...actual, ConsultationService: { getOrderStatus: vi.fn() } };
});

const getOrderStatus = vi.mocked(ConsultationService.getOrderStatus);

function renderPage() {
  return render(
    <ConsultationProvider>
      <OrderPage />
    </ConsultationProvider>
  );
}

function status(overrides: Partial<OrderStatusDto>): OrderStatusDto {
  return {
    paymentStatus: 'PAID',
    expirationDate: null,
    generationStatus: 'GENERATING',
    planJson: null,
    pdfUrl: null,
    thumbnailUrl: null,
    ...overrides,
  };
}

// envuelve el avance del reloj falso en act() para forzar a React a aplicar y renderizar
// cualquier setState pendiente en el mismo tick, antes de que sigamos con las aserciones
async function tick(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  getOrderStatus.mockReset();
  // el inicio del avance de la generación se guarda por orden en sessionStorage
  sessionStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('OrderPage', () => {
  it('shows a loading/generating spinner while the status check is in flight', () => {
    getOrderStatus.mockReturnValue(new Promise(() => {}));
    renderPage();

    expect(screen.getByText(/Estamos generando tu plan nutricional/)).toBeInTheDocument();
  });

  it('polls the order status every 4 seconds while it stays in GENERATING', async () => {
    getOrderStatus.mockResolvedValue(status({ generationStatus: 'GENERATING' }));
    renderPage();
    await tick(0);
    expect(getOrderStatus).toHaveBeenCalledTimes(1);

    await tick(4000);
    expect(getOrderStatus).toHaveBeenCalledTimes(2);

    await tick(4000);
    expect(getOrderStatus).toHaveBeenCalledTimes(3);
  });

  it('while generating shows a simulated progress bar and how long it usually takes', async () => {
    getOrderStatus.mockResolvedValue(status({ generationStatus: 'GENERATING' }));
    renderPage();
    // primera consulta en curso: todavía el spinner, sin barra
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();

    await tick(0);
    const bar = screen.getByRole('progressbar');
    expect(screen.getByText(/suele tardar entre 2 y 3 minutos/)).toBeInTheDocument();
    const initial = Number(bar.getAttribute('aria-valuenow'));

    await tick(120_000);
    const afterTwoMinutes = Number(bar.getAttribute('aria-valuenow'));
    expect(afterTwoMinutes).toBeGreaterThan(initial);
    expect(afterTwoMinutes).toBeLessThan(90);
  });

  it('keeps the progress after a page reload instead of starting over', async () => {
    getOrderStatus.mockResolvedValue(status({ generationStatus: 'GENERATING' }));
    const first = renderPage();
    await tick(120_000);
    const before = Number(screen.getByRole('progressbar').getAttribute('aria-valuenow'));
    first.unmount();

    renderPage();
    await tick(0);

    expect(Number(screen.getByRole('progressbar').getAttribute('aria-valuenow'))).toBeGreaterThanOrEqual(before);
  });

  it('shows a delay notice once generation has been running past 4 minutes', async () => {
    getOrderStatus.mockResolvedValue(status({ generationStatus: 'GENERATING' }));
    renderPage();
    await tick(0);
    expect(screen.queryByText(/más de lo habitual/)).not.toBeInTheDocument();

    await tick(236_000);
    expect(screen.queryByText(/más de lo habitual/)).not.toBeInTheDocument();

    await tick(8000);
    expect(screen.getByText(/más de lo habitual/)).toBeInTheDocument();
  });

  it('stops polling, shows the thumbnail and the download button, and persists the plan once generation completes', async () => {
    const planJson = { personalInfo: { name: 'Ana', lastName: 'Pérez' } } as OrderStatusDto['planJson'];
    const pdfUrl = 'https://signed-url.example/plan.pdf';
    const thumbnailUrl = 'https://signed-url.example/plan.webp';
    getOrderStatus.mockResolvedValue(status({ generationStatus: 'COMPLETED', planJson, pdfUrl, thumbnailUrl }));
    renderPage();
    await tick(0);

    expect(screen.getByText('¡Tu plan nutricional está listo!')).toBeInTheDocument();
    expect(getOrderStatus).toHaveBeenCalledTimes(1);

    // miniatura de la página 1 + botón que descarga el PDF completo; ya no se incrusta el PDF
    expect(screen.getByAltText('Vista previa de tu plan nutricional')).toHaveAttribute('src', thumbnailUrl);
    expect(screen.getByRole('link', { name: /Descargar/ })).toHaveAttribute('href', pdfUrl);
    expect(document.querySelector('iframe')).toBeNull();
    // PlanFileCard en /ordenes/[id] ofrece volver al inicio del área de sesión
    expect(screen.getByRole('link', { name: 'Ir a inicio' })).toHaveAttribute('href', '/inicio');

    await tick(8000);
    expect(getOrderStatus).toHaveBeenCalledTimes(1);

    const stored = JSON.parse(localStorage.getItem('consulta_context')!);
    expect(stored.nutritionPlan).toEqual(planJson);
  });

  it('shows a placeholder, keeping the download button, when the completed plan has no thumbnail', async () => {
    const pdfUrl = 'https://signed-url.example/plan.pdf';
    getOrderStatus.mockResolvedValue(status({ generationStatus: 'COMPLETED', pdfUrl, thumbnailUrl: null }));
    renderPage();
    await tick(0);

    expect(screen.getByText('¡Tu plan nutricional está listo!')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Vista previa no disponible')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Descargar/ })).toHaveAttribute('href', pdfUrl);
  });

  it('shows a reassuring error state and stops polling when generationStatus is ERROR', async () => {
    getOrderStatus.mockResolvedValue(status({ generationStatus: 'ERROR' }));
    renderPage();
    await tick(0);

    expect(screen.getByText('Tu pago está a salvo')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Descargar/ })).not.toBeInTheDocument();

    await tick(8000);
    expect(getOrderStatus).toHaveBeenCalledTimes(1);
  });

  it('shows the rejected-payment state with a retry link and stops polling when paymentStatus is REJECTED', async () => {
    getOrderStatus.mockResolvedValue(status({ paymentStatus: 'REJECTED', generationStatus: 'NOT_STARTED' }));
    renderPage();
    await tick(0);

    expect(screen.getByText('Tu pago fue rechazado')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Reintentar pago' })).toHaveAttribute('href', '/pago/order-1');

    await tick(8000);
    expect(getOrderStatus).toHaveBeenCalledTimes(1);
  });

  it('shows the expired state and stops polling when paymentStatus is EXPIRED', async () => {
    getOrderStatus.mockResolvedValue(status({ paymentStatus: 'EXPIRED', generationStatus: 'NOT_STARTED' }));
    renderPage();
    await tick(0);

    expect(screen.getByText('Esta orden expiró')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Iniciar una nueva consulta' })).toHaveAttribute(
      'href',
      '/consulta/anamnesis'
    );

    await tick(8000);
    expect(getOrderStatus).toHaveBeenCalledTimes(1);
  });

  it('keeps polling without crashing when a status check rejects once, and recovers on the next tick', async () => {
    getOrderStatus
      .mockRejectedValueOnce(new Error('network blip'))
      .mockResolvedValue(status({ generationStatus: 'COMPLETED', pdfUrl: 'https://signed-url.example/plan.pdf' }));
    renderPage();
    await tick(0);
    expect(screen.getByText(/Estamos generando tu plan nutricional/)).toBeInTheDocument();

    await tick(4000);
    expect(getOrderStatus).toHaveBeenCalledTimes(2);
    expect(screen.getByText('¡Tu plan nutricional está listo!')).toBeInTheDocument();
  });

  it('after 5 consecutive failed checks stops polling and offers to retry', async () => {
    getOrderStatus.mockRejectedValue(new Error('network blip'));
    renderPage();
    await tick(0);
    await tick(4000 * 3);
    expect(getOrderStatus).toHaveBeenCalledTimes(4);
    expect(screen.getByText(/Estamos generando tu plan nutricional/)).toBeInTheDocument();

    await tick(4000);
    expect(getOrderStatus).toHaveBeenCalledTimes(5);
    expect(screen.getByText('No pudimos consultar el estado de tu orden')).toBeInTheDocument();

    // ya no insiste solo
    await tick(12_000);
    expect(getOrderStatus).toHaveBeenCalledTimes(5);

    // "Reintentar" vuelve a arrancar el polling
    getOrderStatus.mockResolvedValue(status({ generationStatus: 'GENERATING' }));
    await act(async () => {
      screen.getByRole('button', { name: 'Reintentar' }).click();
    });
    await tick(0);
    expect(getOrderStatus).toHaveBeenCalledTimes(6);
    expect(screen.getByText(/Estamos generando tu plan nutricional/)).toBeInTheDocument();
  });

  it('a successful check resets the consecutive-failure count', async () => {
    getOrderStatus
      .mockRejectedValueOnce(new Error('blip'))
      .mockRejectedValueOnce(new Error('blip'))
      .mockRejectedValueOnce(new Error('blip'))
      .mockRejectedValueOnce(new Error('blip'))
      .mockResolvedValueOnce(status({ generationStatus: 'GENERATING' }))
      .mockRejectedValue(new Error('blip'));
    renderPage();
    await tick(0);
    await tick(4000 * 8); // 4 fallos, 1 éxito, 4 fallos más: nunca 5 seguidos

    expect(screen.queryByText('No pudimos consultar el estado de tu orden')).not.toBeInTheDocument();
  });

  it('shows "Orden no encontrada" and stops polling when the order does not exist or is not the user\'s (404)', async () => {
    getOrderStatus.mockRejectedValue(new ActionError('Orden no encontrada', 404, 'NOT_FOUND'));
    renderPage();
    await tick(0);

    expect(screen.getByText('Orden no encontrada')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/inicio');

    await tick(8000);
    expect(getOrderStatus).toHaveBeenCalledTimes(1);
  });

  it('sends the user to login and stops polling when the session expired', async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign });
    getOrderStatus.mockRejectedValue(new SessionRequiredError('Tu sesión expiró'));
    renderPage();
    await tick(0);

    expect(assign).toHaveBeenCalledWith('/login?error=session_expired');
    await tick(8000);
    expect(getOrderStatus).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it('clears the polling interval on unmount', async () => {
    getOrderStatus.mockResolvedValue(status({ generationStatus: 'GENERATING' }));
    const { unmount } = renderPage();
    await tick(0);
    expect(getOrderStatus).toHaveBeenCalledTimes(1);

    unmount();
    await tick(8000);
    expect(getOrderStatus).toHaveBeenCalledTimes(1);
  });
});
