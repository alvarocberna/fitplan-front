import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlansService, SessionRequiredError } from './plans.service';
import { getPredefinedProductAction, createPredefinedOrderAction } from './plans.actions';

vi.mock('./plans.actions', () => ({
  getPredefinedProductAction: vi.fn(),
  createPredefinedOrderAction: vi.fn(),
}));

const mockedGetProduct = vi.mocked(getPredefinedProductAction);
const mockedCreateOrder = vi.mocked(createPredefinedOrderAction);

beforeEach(() => {
  mockedGetProduct.mockReset();
  mockedCreateOrder.mockReset();
});

describe('PlansService', () => {
  it('getPredefinedProduct devuelve la ficha del producto', async () => {
    const product = {
      code: 'plan-gimnasio-volumen-50-60-m-joven',
      name: 'Plan Volumen',
      description: 'd',
      price: 14990,
      currency: 'CLP',
      thumbnailUrl: null,
    };
    mockedGetProduct.mockResolvedValue({ ok: true, data: product });

    await expect(PlansService.getPredefinedProduct('plan-gimnasio-volumen-50-60-m-joven')).resolves.toEqual(product);
    expect(mockedGetProduct).toHaveBeenCalledWith('plan-gimnasio-volumen-50-60-m-joven');
  });

  it('getPredefinedProduct lanza un Error con el mensaje si la acción falla', async () => {
    mockedGetProduct.mockResolvedValue({ ok: false, message: 'Plan x no disponible' });

    await expect(PlansService.getPredefinedProduct('x')).rejects.toThrow('Plan x no disponible');
  });

  it('createPredefinedOrder devuelve el orderId', async () => {
    mockedCreateOrder.mockResolvedValue({ ok: true, data: { orderId: 'order-1' } });

    await expect(PlansService.createPredefinedOrder('plan-gimnasio-volumen-50-60-m-joven')).resolves.toEqual({
      orderId: 'order-1',
    });
    expect(mockedCreateOrder).toHaveBeenCalledWith('plan-gimnasio-volumen-50-60-m-joven');
  });

  it('createPredefinedOrder lanza SessionRequiredError si la acción indica que no hay sesión', async () => {
    mockedCreateOrder.mockResolvedValue({ ok: false, message: 'Inicia sesión', code: 'unauthenticated' });

    await expect(PlansService.createPredefinedOrder('c')).rejects.toBeInstanceOf(SessionRequiredError);
  });

  it('createPredefinedOrder lanza un Error común (no SessionRequiredError) ante cualquier otro fallo', async () => {
    mockedCreateOrder.mockResolvedValue({ ok: false, message: 'Plan no disponible' });

    const error = await PlansService.createPredefinedOrder('c').catch((e) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(SessionRequiredError);
    expect(error.message).toBe('Plan no disponible');
  });
});
