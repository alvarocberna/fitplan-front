import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlanDetail from '@/app/planes/[slug]/page';
import { PlansService } from '@/features/plans/services/plans.service';
import { PlanSelectionProvider } from '@/shared';

const pushMock = vi.fn();
let slug = 'plan-gimnasio-volumen';
vi.mock('next/navigation', () => ({
  useParams: () => ({ slug }),
  useRouter: () => ({ push: pushMock }),
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));
vi.mock('@/features/plans/services/plans.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/plans/services/plans.service')>();
  return { ...actual, PlansService: { getPredefinedProduct: vi.fn(), createPredefinedOrder: vi.fn() } };
});

const getProduct = vi.mocked(PlansService.getPredefinedProduct);

const PRODUCT = {
  code: 'plan-gimnasio-volumen-50-60-m-joven',
  name: 'Plan Volumen',
  description: 'd',
  price: 14990,
  currency: 'CLP',
  thumbnailUrl: 'https://bucket.example/miniatura.webp?sig=abc',
};

function renderPage() {
  return render(
    <PlanSelectionProvider>
      <PlanDetail />
    </PlanSelectionProvider>
  );
}

async function fillAll(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByLabelText('Peso'), '50-60');
  await user.type(screen.getByLabelText('Talla (cm)'), '175');
  await user.selectOptions(screen.getByLabelText('Sexo'), 'm');
  await user.selectOptions(screen.getByLabelText('Edad'), '18-30');
}

beforeEach(() => {
  slug = 'plan-gimnasio-volumen';
  pushMock.mockClear();
  getProduct.mockReset();
});

describe('PlanDetail (/planes/[slug])', () => {
  it('muestra título, descripción y los 4 campos; sin datos completos no consulta nada y no deja añadir al carro', async () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Plan Gimnasio Volumen' })).toBeInTheDocument();
    expect(screen.getByLabelText('Peso')).toBeInTheDocument();
    expect(screen.getByLabelText('Talla (cm)')).toBeInTheDocument();
    expect(screen.getByLabelText('Sexo')).toBeInTheDocument();
    expect(screen.getByLabelText('Edad')).toBeInTheDocument();
    expect(screen.getByText(/Completa tus datos para ver el plan más adecuado/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Añadir al carro' })).toBeDisabled();
    expect(getProduct).not.toHaveBeenCalled();
  });

  it('parte con los datos que el usuario ya completó en el modal (estado global)', async () => {
    localStorage.setItem(
      'plan_selection',
      JSON.stringify({
        selection: { weightRange: '60-70', heightCm: '170', sex: 'f', ageRange: '40-50' },
        cartItem: null,
      })
    );
    getProduct.mockResolvedValue({ ...PRODUCT, code: 'plan-gimnasio-volumen-60-70-f-adulto' });
    renderPage();

    await waitFor(() => expect(getProduct).toHaveBeenCalledWith('plan-gimnasio-volumen-60-70-f-adulto'));
    expect(screen.getByLabelText('Peso')).toHaveValue('60-70');
    expect(screen.getByLabelText('Talla (cm)')).toHaveValue(170);
    expect(screen.getByLabelText('Sexo')).toHaveValue('f');
    expect(screen.getByLabelText('Edad')).toHaveValue('40-50');
  });

  it('al completar los datos busca la versión que corresponde, muestra su precio y su miniatura, y habilita "Añadir al carro"', async () => {
    getProduct.mockResolvedValue(PRODUCT);
    const user = userEvent.setup();
    renderPage();

    await fillAll(user);

    await waitFor(() => expect(getProduct).toHaveBeenCalledWith('plan-gimnasio-volumen-50-60-m-joven'));
    expect(await screen.findByText('$14.990')).toBeInTheDocument();
    expect(screen.getByAltText('Plan Gimnasio Volumen')).toHaveAttribute('src', PRODUCT.thumbnailUrl);
    expect(screen.getByRole('button', { name: 'Añadir al carro' })).toBeEnabled();
  });

  it('cambiar el peso cambia la versión que se busca', async () => {
    getProduct.mockResolvedValue(PRODUCT);
    const user = userEvent.setup();
    renderPage();
    await fillAll(user);
    await waitFor(() => expect(getProduct).toHaveBeenCalledWith('plan-gimnasio-volumen-50-60-m-joven'));

    await user.selectOptions(screen.getByLabelText('Peso'), '100-120');

    await waitFor(() => expect(getProduct).toHaveBeenCalledWith('plan-gimnasio-volumen-100-120-m-joven'));
  });

  it('sin miniatura de la versión, usa la imagen estática del plan', async () => {
    getProduct.mockResolvedValue({ ...PRODUCT, thumbnailUrl: null });
    const user = userEvent.setup();
    renderPage();

    await fillAll(user);

    await screen.findByText('$14.990');
    expect(screen.getByAltText('Plan Gimnasio Volumen').getAttribute('src')).toContain('img_informe1.jpg');
  });

  it('si la versión no está disponible lo avisa y no deja añadir al carro', async () => {
    getProduct.mockRejectedValue(new Error('Plan no disponible'));
    const user = userEvent.setup();
    renderPage();

    await fillAll(user);

    expect(await screen.findByRole('alert')).toHaveTextContent('aún no está disponible');
    expect(screen.getByRole('button', { name: 'Añadir al carro' })).toBeDisabled();
  });

  it('"Añadir al carro" guarda ese plan (reemplazando lo anterior) y va a /carrito', async () => {
    localStorage.setItem(
      'plan_selection',
      JSON.stringify({ selection: {}, cartItem: { planSlug: 'plan-running', code: 'plan-running-50-60-m-joven' } })
    );
    getProduct.mockResolvedValue(PRODUCT);
    const user = userEvent.setup();
    renderPage();
    await fillAll(user);
    await screen.findByText('$14.990');

    await user.click(screen.getByRole('button', { name: 'Añadir al carro' }));

    expect(JSON.parse(localStorage.getItem('plan_selection')!).cartItem).toEqual({
      planSlug: 'plan-gimnasio-volumen',
      code: 'plan-gimnasio-volumen-50-60-m-joven',
    });
    expect(pushMock).toHaveBeenCalledWith('/carrito');
  });

  it('un slug desconocido responde 404 (notFound)', () => {
    slug = 'plan-futbol';
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderPage()).toThrow('NEXT_NOT_FOUND');

    consoleError.mockRestore();
  });
});
