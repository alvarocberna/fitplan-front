import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Plans from '@/app/planes-estandar/page';
import { PlanSelectionModal } from '@/features/plans/components/plan-selection-modal.component';
import { PlanSelectionProvider, PLANS } from '@/shared';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

function renderPage() {
  return render(
    <PlanSelectionProvider>
      <Plans />
      <PlanSelectionModal />
    </PlanSelectionProvider>
  );
}

describe('Plans (/planes-estandar)', () => {
  it('cada plan ofrece "Seleccionar" (ya no "Añadir al carro") y "Ver más" hacia su detalle', () => {
    renderPage();

    expect(screen.getAllByRole('button', { name: 'Seleccionar' })).toHaveLength(PLANS.length);
    expect(screen.queryByText('Añadir al carro')).not.toBeInTheDocument();
    const links = screen.getAllByRole('link', { name: 'Ver más' }).map((a) => a.getAttribute('href'));
    expect(links).toEqual(PLANS.map((plan) => `/planes-estandar/${plan.slug}`));
  });

  it('"Seleccionar" abre el modal para completar peso, talla, sexo y edad', async () => {
    const user = userEvent.setup();
    renderPage();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Seleccionar' })[0]);

    expect(
      screen.getByRole('dialog', { name: 'Completa tu información para obtener el plan más adecuado' })
    ).toBeInTheDocument();
  });
});
