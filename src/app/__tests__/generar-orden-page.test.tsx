import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import GenerateOrderPage from '@/app/(sesion)/consulta/generar-orden/page';
import { ConsultationProvider } from '@/shared';
import { getPersonalizedProductAction } from '@/features/plans/services/plans.actions';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
// la página pide el precio con usePersonalizedProduct -> PlansService -> esta Server Action
vi.mock('@/features/plans/services/plans.actions', () => ({
  getPersonalizedProductAction: vi.fn(),
  getPredefinedProductAction: vi.fn(),
  createPredefinedOrderAction: vi.fn(),
  getPlanPreviewsAction: vi.fn(),
}));

const getPersonalizedProduct = vi.mocked(getPersonalizedProductAction);

function renderPage() {
  return render(
    <ConsultationProvider>
      <GenerateOrderPage />
    </ConsultationProvider>
  );
}

beforeEach(() => {
  getPersonalizedProduct.mockReset();
});

describe('GenerateOrderPage (/consulta/generar-orden)', () => {
  it('muestra el precio que entrega el backend en el ítem, el subtotal y el total', async () => {
    getPersonalizedProduct.mockResolvedValue({
      ok: true,
      data: { name: 'Plan Nutricional Personalizado', description: 'd', price: 4990, currency: 'CLP' },
    });
    renderPage();

    expect(await screen.findAllByText('$4.990')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Realizar pago' })).toBeInTheDocument();
  });

  it('mientras el precio no llega muestra "—" (nunca un monto fijo)', () => {
    getPersonalizedProduct.mockReturnValue(new Promise(() => {}));
    renderPage();

    expect(screen.getAllByText('—')).toHaveLength(3);
    expect(screen.queryByText(/\$\s?\d/)).not.toBeInTheDocument();
  });

  it('si el backend no tiene el producto disponible deja "—"', async () => {
    getPersonalizedProduct.mockResolvedValue({ ok: false, message: 'Plan personalizado no disponible' });
    renderPage();

    // espera a que la consulta termine: el estado pasa a "unavailable" y el precio sigue sin mostrarse
    await vi.waitFor(() => expect(getPersonalizedProduct).toHaveBeenCalled());
    expect(await screen.findAllByText('—')).toHaveLength(3);
  });
});
