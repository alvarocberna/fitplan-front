import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlanSelectionModal } from './plan-selection-modal.component';
import { PlanSelectionProvider, usePlanSelection } from '@/shared';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }) }));

const TITLE = 'Completa tu información para obtener el plan más adecuado';

function OpenButton({ slug }: { slug: string }) {
  const { openSelectionModal } = usePlanSelection();
  return <button onClick={() => openSelectionModal(slug)}>Seleccionar</button>;
}

function renderModal(slug = 'plan-gimnasio-volumen') {
  return render(
    <PlanSelectionProvider>
      <OpenButton slug={slug} />
      <PlanSelectionModal />
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
  pushMock.mockClear();
});

describe('PlanSelectionModal', () => {
  it('está cerrado hasta que se pide seleccionar un plan', () => {
    renderModal();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('al abrir muestra el título y los 4 campos: peso, talla, sexo y edad', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: 'Seleccionar' }));

    expect(screen.getByRole('dialog', { name: TITLE })).toBeInTheDocument();
    expect(screen.getByLabelText('Peso')).toBeInTheDocument();
    expect(screen.getByLabelText('Talla (cm)')).toBeInTheDocument();
    expect(screen.getByLabelText('Sexo')).toBeInTheDocument();
    expect(screen.getByLabelText('Edad')).toBeInTheDocument();
  });

  it('ofrece los 7 rangos de peso, los 2 sexos y los rangos de edad pedidos', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole('button', { name: 'Seleccionar' }));

    const optionsOf = (label: string) =>
      Array.from(screen.getByLabelText(label).querySelectorAll('option:not([disabled])')).map((o) => o.textContent);

    expect(optionsOf('Peso')).toEqual([
      '40 - 49.9 kg',
      '50 - 59.9 kg',
      '60 - 69.9 kg',
      '70 - 79.9 kg',
      '80 - 89.9 kg',
      '90 - 99.9 kg',
      '100 - 120 kg',
    ]);
    expect(optionsOf('Sexo')).toEqual(['Masculino', 'Femenino']);
    expect(optionsOf('Edad')).toEqual([
      '18 - 30 años',
      '30 - 40 años',
      '40 - 50 años',
      '50 - 60 años',
      'Más de 60 años',
    ]);
  });

  it('"Confirmar" está deshabilitado hasta completar los 4 campos', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole('button', { name: 'Seleccionar' }));
    const confirm = screen.getByRole('button', { name: 'Confirmar' });
    expect(confirm).toBeDisabled();

    await user.selectOptions(screen.getByLabelText('Peso'), '50-60');
    await user.type(screen.getByLabelText('Talla (cm)'), '175');
    await user.selectOptions(screen.getByLabelText('Sexo'), 'm');
    expect(confirm).toBeDisabled();

    await user.selectOptions(screen.getByLabelText('Edad'), '18-30');
    expect(confirm).toBeEnabled();
  });

  it('una talla inválida (0) mantiene "Confirmar" deshabilitado', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole('button', { name: 'Seleccionar' }));
    await fillAll(user);
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeEnabled();

    await user.clear(screen.getByLabelText('Talla (cm)'));
    await user.type(screen.getByLabelText('Talla (cm)'), '0');

    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeDisabled();
  });

  it('al confirmar guarda la selección en el estado global, cierra el modal y va a /planes/<plan>', async () => {
    const user = userEvent.setup();
    renderModal('plan-gimnasio-definicion');
    await user.click(screen.getByRole('button', { name: 'Seleccionar' }));
    await fillAll(user);

    await user.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(pushMock).toHaveBeenCalledWith('/planes/plan-gimnasio-definicion');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(JSON.parse(localStorage.getItem('plan_selection')!).selection).toEqual({
      weightRange: '50-60',
      heightCm: '175',
      sex: 'm',
      ageRange: '18-30',
    });
  });

  it('no navega si el plan para el que se abrió no es uno de los planes conocidos', async () => {
    const user = userEvent.setup();
    renderModal('plan-inexistente');
    await user.click(screen.getByRole('button', { name: 'Seleccionar' }));
    await fillAll(user);

    await user.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(pushMock).not.toHaveBeenCalled();
  });

  it('se puede cerrar con Escape sin navegar', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole('button', { name: 'Seleccionar' }));

    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(pushMock).not.toHaveBeenCalled();
  });
});
