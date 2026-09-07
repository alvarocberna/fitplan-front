import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import OrderPage from '@/app/orders/[id]/page';
import { ConsultationProvider } from '@/shared';
import { ConsultationService } from '@/features';
import type { OrderStatusDto } from '@/features';

vi.mock('next/navigation', () => ({ useParams: () => ({ id: 'order-1' }) }));
vi.mock('next/dynamic', () => ({
  default: () => function DownloadPlanPdfStub() {
    return <div>Descargar PDF</div>;
  },
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
  return { paymentStatus: 'pagado', generationStatus: 'generando', planJson: null, ...overrides };
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

  it('polls the order status every 4 seconds while it stays in "generando"', async () => {
    getOrderStatus.mockResolvedValue(status({ generationStatus: 'generando' }));
    renderPage();
    await tick(0);
    expect(getOrderStatus).toHaveBeenCalledTimes(1);

    await tick(4000);
    expect(getOrderStatus).toHaveBeenCalledTimes(2);

    await tick(4000);
    expect(getOrderStatus).toHaveBeenCalledTimes(3);
  });

  it('shows a delay notice once generation has been running past 45 seconds', async () => {
    getOrderStatus.mockResolvedValue(status({ generationStatus: 'generando' }));
    renderPage();
    await tick(0);
    expect(screen.queryByText(/tardando más de lo normal/)).not.toBeInTheDocument();

    await tick(44_000);
    expect(screen.queryByText(/tardando más de lo normal/)).not.toBeInTheDocument();

    await tick(4000);
    expect(screen.getByText(/tardando más de lo normal/)).toBeInTheDocument();
  });

  it('stops polling, shows the download button and persists the plan once generation completes', async () => {
    const planJson = { personalInfo: { name: 'Ana', lastName: 'Pérez' } } as OrderStatusDto['planJson'];
    getOrderStatus.mockResolvedValue(status({ generationStatus: 'completado', planJson }));
    renderPage();
    await tick(0);

    expect(screen.getByText('¡Tu plan nutricional está listo!')).toBeInTheDocument();
    expect(getOrderStatus).toHaveBeenCalledTimes(1);

    await tick(8000);
    expect(getOrderStatus).toHaveBeenCalledTimes(1);

    const stored = JSON.parse(localStorage.getItem('consulta_context')!);
    expect(stored.nutritionPlan).toEqual(planJson);
  });

  it('shows a reassuring error state and stops polling when generationStatus is "error"', async () => {
    getOrderStatus.mockResolvedValue(status({ generationStatus: 'error' }));
    renderPage();
    await tick(0);

    expect(screen.getByText('Tu pago está a salvo')).toBeInTheDocument();
    expect(screen.queryByText('Descargar PDF')).not.toBeInTheDocument();

    await tick(8000);
    expect(getOrderStatus).toHaveBeenCalledTimes(1);
  });

  it('keeps polling without crashing when a status check rejects, and still raises the delay notice past 45s', async () => {
    getOrderStatus.mockRejectedValue(new Error('network blip'));
    renderPage();
    await tick(0);
    expect(screen.getByText(/Estamos generando tu plan nutricional/)).toBeInTheDocument();

    await tick(4000);
    expect(getOrderStatus).toHaveBeenCalledTimes(2);

    await tick(44_000);
    await tick(4000);
    expect(screen.getByText(/tardando más de lo normal/)).toBeInTheDocument();
  });

  it('clears the polling interval on unmount', async () => {
    getOrderStatus.mockResolvedValue(status({ generationStatus: 'generando' }));
    const { unmount } = renderPage();
    await tick(0);
    expect(getOrderStatus).toHaveBeenCalledTimes(1);

    unmount();
    await tick(8000);
    expect(getOrderStatus).toHaveBeenCalledTimes(1);
  });
});
