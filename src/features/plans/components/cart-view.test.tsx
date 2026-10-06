import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'react-toastify';
import { CartView } from './cart-view.component';
import { PlansService, SessionRequiredError } from '../services/plans.service';
import { PlanSelectionProvider } from '@/shared';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }) }));
vi.mock('react-toastify', () => ({ toast: { error: vi.fn() } }));
vi.mock('../services/plans.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/plans.service')>();
  return {
    ...actual,
    PlansService: { getPredefinedProduct: vi.fn(), createPredefinedOrder: vi.fn() },
  };
});

const getProduct = vi.mocked(PlansService.getPredefinedProduct);
const createOrder = vi.mocked(PlansService.createPredefinedOrder);

const CODE = 'plan-gimnasio-volumen-50-60-m-joven';
const PRODUCT = {
  code: CODE,
  name: 'Plan Volumen · 50–59.9 kg · Hombre · menor de 30 años',
  description: 'd',
  price: 14990,
  currency: 'CLP',
  thumbnailUrl: null,
};

function seedCart() {
  localStorage.setItem(
    'plan_selection',
    JSON.stringify({ selection: {}, cartItem: { planSlug: 'plan-gimnasio-volumen', code: CODE } })
  );
}

function renderCart(isAuthenticated: boolean) {
  return render(
    <PlanSelectionProvider>
      <CartView isAuthenticated={isAuthenticated} />
    </PlanSelectionProvider>
  );
}

beforeEach(() => {
  pushMock.mockClear();
  vi.mocked(toast.error).mockClear();
  getProduct.mockReset();
  createOrder.mockReset();
});

describe('CartView', () => {
  it('carro vacío: lo dice y "Pagar" está deshabilitado', async () => {
    renderCart(true);

    expect(await screen.findByText('Tu carro está vacío.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pagar' })).toBeDisabled();
    expect(getProduct).not.toHaveBeenCalled();
  });

  it('con un plan en el carro: muestra su nombre y precio reales (del backend) y habilita "Pagar"', async () => {
    seedCart();
    getProduct.mockResolvedValue(PRODUCT);
    renderCart(true);

    expect(await screen.findByText(PRODUCT.name)).toBeInTheDocument();
    expect(getProduct).toHaveBeenCalledWith(CODE);
    //precio de la fila, subtotal y total
    expect(screen.getAllByText('$14.990')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Pagar' })).toBeEnabled();
  });

  it('si la versión ya no está disponible avisa y no deja pagar', async () => {
    seedCart();
    getProduct.mockRejectedValue(new Error('Plan no disponible'));
    renderCart(true);

    expect(await screen.findByRole('alert')).toHaveTextContent('ya no está disponible');
    expect(screen.getByRole('button', { name: 'Pagar' })).toBeDisabled();
  });

  it('"Quitar del carro" vacía el carro', async () => {
    seedCart();
    getProduct.mockResolvedValue(PRODUCT);
    const user = userEvent.setup();
    renderCart(true);
    await screen.findByText(PRODUCT.name);

    await user.click(screen.getByRole('button', { name: 'Quitar del carro' }));

    expect(screen.getByText('Tu carro está vacío.')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('plan_selection')!).cartItem).toBeNull();
  });

  it('sin sesión: "Pagar" abre el modal de registro (con vuelta al carro) y NO crea la orden', async () => {
    seedCart();
    getProduct.mockResolvedValue(PRODUCT);
    const user = userEvent.setup();
    renderCart(false);
    await screen.findByText(PRODUCT.name);

    await user.click(screen.getByRole('button', { name: 'Pagar' }));

    expect(screen.getByRole('dialog', { name: 'Inicia sesión para continuar' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Registro' })).toHaveAttribute(
      'href',
      '/api/cognito/login?screen_hint=signup&return_to=%2Fcarrito'
    );
    expect(createOrder).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('con sesión: "Pagar" crea la orden del plan y lleva a la pasarela marcándola como predefinida', async () => {
    seedCart();
    getProduct.mockResolvedValue(PRODUCT);
    createOrder.mockResolvedValue({ orderId: 'order-1' });
    const user = userEvent.setup();
    renderCart(true);
    await screen.findByText(PRODUCT.name);

    await user.click(screen.getByRole('button', { name: 'Pagar' }));

    expect(createOrder).toHaveBeenCalledWith(CODE);
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/pago/order-1?tipo=predefinido'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('si la sesión expiró al pagar (SessionRequiredError) abre el modal de registro en vez de mostrar un error', async () => {
    seedCart();
    getProduct.mockResolvedValue(PRODUCT);
    createOrder.mockRejectedValue(new SessionRequiredError('Inicia sesión'));
    const user = userEvent.setup();
    renderCart(true);
    await screen.findByText(PRODUCT.name);

    await user.click(screen.getByRole('button', { name: 'Pagar' }));

    expect(await screen.findByRole('dialog', { name: 'Inicia sesión para continuar' })).toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
    //vuelve a poder pagar
    expect(screen.getByRole('button', { name: 'Pagar' })).toBeEnabled();
  });

  it('ante cualquier otro error al crear la orden muestra un toast y no navega', async () => {
    seedCart();
    getProduct.mockResolvedValue(PRODUCT);
    createOrder.mockRejectedValue(new Error('Plan no disponible'));
    const user = userEvent.setup();
    renderCart(true);
    await screen.findByText(PRODUCT.name);

    await user.click(screen.getByRole('button', { name: 'Pagar' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Plan no disponible', expect.anything()));
    expect(pushMock).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
