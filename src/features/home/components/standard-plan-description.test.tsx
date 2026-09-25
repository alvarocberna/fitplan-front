import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { StandardPlanDescription } from './standard-plan-description.component';
import { PlansService } from '../../plans/services/plans.service';
import { PlanSelectionProvider, PLANS } from '@/shared';

vi.mock('../../plans/services/plans.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../plans/services/plans.service')>();
  return { ...actual, PlansService: { getPlanPreviews: vi.fn() } };
});

const getPlanPreviews = vi.mocked(PlansService.getPlanPreviews);

const PREVIEWS = [
  {
    code: 'plan-gimnasio-volumen',
    name: 'Plan Gimnasio Volumen',
    description: 'd',
    thumbnailUrl: 'https://bucket.example/plan-gimnasio-volumen.webp?sig=abc',
  },
  {
    code: 'plan-gimnasio-definicion',
    name: 'Plan Gimnasio Definición',
    description: 'd',
    thumbnailUrl: 'https://bucket.example/plan-gimnasio-definicion.webp?sig=abc',
  },
  {
    code: 'plan-running',
    name: 'Plan Running',
    description: 'd',
    thumbnailUrl: null,
  },
  {
    code: 'plan-deporte-cancha',
    name: 'Plan Deporte de Cancha',
    description: 'd',
    thumbnailUrl: 'https://bucket.example/plan-deporte-cancha.webp?sig=abc',
  },
];

function renderCarousel() {
  return render(
    <PlanSelectionProvider>
      <StandardPlanDescription />
    </PlanSelectionProvider>
  );
}

beforeEach(() => {
  getPlanPreviews.mockReset();
});

describe('StandardPlanDescription', () => {
  it('mientras carga, muestra el catálogo estático como respaldo (título e imagen de relleno)', () => {
    getPlanPreviews.mockReturnValue(new Promise(() => {})); // nunca resuelve en este test

    renderCarousel();

    // PLANS aparece duplicado al inicio del carrusel (VISIBLE=3 ítems extra para el loop)
    expect(screen.getAllByText(PLANS[0].title).length).toBeGreaterThanOrEqual(1);
    const images = screen.getAllByAltText(PLANS[0].title);
    expect(images[0]).toHaveAttribute('src', expect.stringContaining('img_informe1.jpg'));
  });

  it('una vez listo, muestra los títulos y miniaturas reales de la base de datos', async () => {
    getPlanPreviews.mockResolvedValue(PREVIEWS);

    renderCarousel();

    await waitFor(() => expect(screen.getAllByText('Plan Gimnasio Volumen').length).toBeGreaterThan(0));
    expect(screen.getAllByAltText('Plan Gimnasio Volumen')[0]).toHaveAttribute(
      'src',
      PREVIEWS[0].thumbnailUrl!
    );
    // sin miniatura (plan-running): cae a la imagen estática, no rompe
    expect(screen.getAllByAltText('Plan Running')[0]).toHaveAttribute(
      'src',
      expect.stringContaining('img_informe1.jpg')
    );
  });

  it('"Ver más" enlaza a /planes/<code> con el code real una vez cargado', async () => {
    getPlanPreviews.mockResolvedValue(PREVIEWS);

    renderCarousel();

    await waitFor(() => expect(screen.getAllByText('Plan Gimnasio Volumen').length).toBeGreaterThan(0));
    const links = screen.getAllByRole('link', { name: 'Ver más' });
    expect(links[0]).toHaveAttribute('href', '/planes/plan-gimnasio-volumen');
  });

  it('si la consulta falla, se queda en el catálogo estático (nunca queda vacío)', async () => {
    getPlanPreviews.mockRejectedValue(new Error('backend caído'));

    renderCarousel();

    await waitFor(() => expect(getPlanPreviews).toHaveBeenCalled());
    expect(screen.getAllByText(PLANS[0].title).length).toBeGreaterThan(0);
  });

  it('si la consulta resuelve vacía, se queda en el catálogo estático', async () => {
    getPlanPreviews.mockResolvedValue([]);

    renderCarousel();

    await waitFor(() => expect(getPlanPreviews).toHaveBeenCalled());
    expect(screen.getAllByText(PLANS[0].title).length).toBeGreaterThan(0);
  });
});
