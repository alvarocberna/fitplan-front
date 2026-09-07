import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'react-toastify';
import { FormMeasurements } from './form-measurements';
import { ConsultationProvider } from '@/shared';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }) }));
vi.mock('react-toastify', () => ({ toast: { error: vi.fn() } }));

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
});

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

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/consultation/generate-order'));
    const stored = JSON.parse(localStorage.getItem('consulta_context')!);
    expect(stored.measurements.weight).toBe(70);
    expect(stored.measurements.height).toBe(170);
    expect(typeof stored.measurements.weight).toBe('number');
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
