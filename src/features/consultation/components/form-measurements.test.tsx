import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'react-toastify';
import { FormMeasurements } from './form-measurements';
import { ConsultationProvider } from '@/shared';
import { ConsultationService } from '@/features';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }) }));
vi.mock('react-toastify', () => ({ toast: { error: vi.fn() } }));
vi.mock('@/features', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features')>();
  return { ...actual, ConsultationService: { evaluateGoalFeasibility: vi.fn() } };
});

const evaluateGoalFeasibility = vi.mocked(ConsultationService.evaluateGoalFeasibility);
const NOT_FEASIBLE_MESSAGE =
  'Lo siento, he detectado que tu peso corporal ya está bajo, y trabajar una pérdida de peso podría no ser adecuado. Si quieres, podemos trabajar otros objetivos.';
const LOSE_WEIGHT_ANAMNESIS = {
  goals: { primaryGoal: 'bajar de peso', secondaryGoal: null },
  clinical: null,
  dietary: null,
  lifestyle: null,
};

const VALID_PERSONAL_INFO = { firstName: 'Ana', gender: 'FEMENINO' };
const VALID_ANAMNESIS = { goals: null, clinical: null, dietary: null, lifestyle: null };

function seedContext(personalInfo: unknown, anamnesis: unknown) {
  localStorage.setItem(
    'consulta_context',
    JSON.stringify({ personalInfo, anamnesis, measurements: null, nutritionPlan: null })
  );
}

function renderForm() {
  return render(
    <ConsultationProvider>
      <FormMeasurements />
    </ConsultationProvider>
  );
}

async function waitForHydratedRadios() {
  await waitFor(() => expect(screen.getAllByRole('radio')).toHaveLength(6));
}

beforeEach(() => {
  pushMock.mockClear();
  vi.mocked(toast.error).mockClear();
  evaluateGoalFeasibility.mockReset();
  evaluateGoalFeasibility.mockResolvedValue({ feasible: true, goal: 'mantencion', message: null });
});

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>, weight = '70', height = '170') {
  await user.type(screen.getByLabelText('Peso'), weight);
  await user.type(screen.getByLabelText('Talla'), height);
  await user.click(screen.getAllByRole('radio')[2]);
  await user.click(screen.getByRole('button', { name: 'Finalizar consulta' }));
}

describe('FormMeasurements', () => {
  it('blocks submit and shows a toast when personalInfo is missing from previous steps', async () => {
    seedContext(null, VALID_ANAMNESIS);
    const user = userEvent.setup();
    renderForm();
    await waitForHydratedRadios();

    await user.type(screen.getByLabelText('Peso'), '70');
    await user.type(screen.getByLabelText('Talla'), '170');
    await user.click(screen.getAllByRole('radio')[0]);
    await user.click(screen.getByRole('button', { name: 'Finalizar consulta' }));

    expect(toast.error).toHaveBeenCalledWith('Faltan datos de pasos anteriores');
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('blocks submit and shows a toast when anamnesis is missing from previous steps', async () => {
    seedContext(VALID_PERSONAL_INFO, null);
    const user = userEvent.setup();
    renderForm();
    await waitForHydratedRadios();

    await user.type(screen.getByLabelText('Peso'), '70');
    await user.type(screen.getByLabelText('Talla'), '170');
    await user.click(screen.getAllByRole('radio')[0]);
    await user.click(screen.getByRole('button', { name: 'Finalizar consulta' }));

    expect(toast.error).toHaveBeenCalledWith('Faltan datos de pasos anteriores');
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('submits weight/height as numbers, persists measurements and navigates to generate-order', async () => {
    seedContext(VALID_PERSONAL_INFO, VALID_ANAMNESIS);
    const user = userEvent.setup();
    renderForm();
    await waitForHydratedRadios();

    await user.type(screen.getByLabelText('Peso'), '70');
    await user.type(screen.getByLabelText('Talla'), '170');
    await user.click(screen.getAllByRole('radio')[2]);
    await user.click(screen.getByRole('button', { name: 'Finalizar consulta' }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/consulta/generar-orden'));
    expect(evaluateGoalFeasibility).toHaveBeenCalledWith({
      goals: null,
      measurements: { weight: 70, height: 170 },
    });
    const stored = JSON.parse(localStorage.getItem('consulta_context')!);
    expect(stored.measurements.weight).toBe(70);
    expect(stored.measurements.height).toBe(170);
    expect(typeof stored.measurements.weight).toBe('number');
  });

  it('shows the not-feasible message with exit/new-consultation buttons instead of navigating', async () => {
    seedContext(VALID_PERSONAL_INFO, LOSE_WEIGHT_ANAMNESIS);
    evaluateGoalFeasibility.mockResolvedValue({ feasible: false, goal: 'definicion', message: NOT_FEASIBLE_MESSAGE });
    const user = userEvent.setup();
    renderForm();
    await waitForHydratedRadios();

    await fillAndSubmit(user, '55', '170');

    expect(await screen.findByText(NOT_FEASIBLE_MESSAGE)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salir' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nueva consulta' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Finalizar consulta' })).not.toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
    expect(evaluateGoalFeasibility).toHaveBeenCalledWith({
      goals: LOSE_WEIGHT_ANAMNESIS.goals,
      measurements: { weight: 55, height: 170 },
    });
  });

  it('new consultation discards anamnesis and measurements (keeping personal info) and goes back to the chat', async () => {
    seedContext(VALID_PERSONAL_INFO, LOSE_WEIGHT_ANAMNESIS);
    evaluateGoalFeasibility.mockResolvedValue({ feasible: false, goal: 'definicion', message: NOT_FEASIBLE_MESSAGE });
    const user = userEvent.setup();
    renderForm();
    await waitForHydratedRadios();
    await fillAndSubmit(user, '55', '170');

    await user.click(await screen.findByRole('button', { name: 'Nueva consulta' }));

    expect(pushMock).toHaveBeenCalledWith('/consulta/anamnesis');
    const stored = JSON.parse(localStorage.getItem('consulta_context')!);
    expect(stored.anamnesis).toBeNull();
    expect(stored.measurements).toBeNull();
    expect(stored.personalInfo).toEqual(VALID_PERSONAL_INFO);
  });

  it('exit discards the consultation and goes to the panel', async () => {
    seedContext(VALID_PERSONAL_INFO, LOSE_WEIGHT_ANAMNESIS);
    evaluateGoalFeasibility.mockResolvedValue({ feasible: false, goal: 'definicion', message: NOT_FEASIBLE_MESSAGE });
    const user = userEvent.setup();
    renderForm();
    await waitForHydratedRadios();
    await fillAndSubmit(user, '55', '170');

    await user.click(await screen.findByRole('button', { name: 'Salir' }));

    expect(pushMock).toHaveBeenCalledWith('/panel');
    const stored = JSON.parse(localStorage.getItem('consulta_context')!);
    expect(stored.anamnesis).toBeNull();
    expect(stored.measurements).toBeNull();
  });

  it('shows a toast and stays on the form when the evaluation fails', async () => {
    seedContext(VALID_PERSONAL_INFO, VALID_ANAMNESIS);
    evaluateGoalFeasibility.mockRejectedValue(new Error('backend caido'));
    const user = userEvent.setup();
    renderForm();
    await waitForHydratedRadios();

    await fillAndSubmit(user);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('No pudimos evaluar tu objetivo, intenta nuevamente'),
    );
    expect(pushMock).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Finalizar consulta' })).toBeInTheDocument();
  });

  it('does not submit or show a toast when weight/height/somatotype are left empty', async () => {
    seedContext(VALID_PERSONAL_INFO, VALID_ANAMNESIS);
    const user = userEvent.setup();
    renderForm();
    await waitForHydratedRadios();

    await user.click(screen.getByRole('button', { name: 'Finalizar consulta' }));

    expect(pushMock).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });
});
