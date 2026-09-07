import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormUserInfo } from './form-user-info';
import { ConsultationProvider } from '@/shared';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }) }));

function renderForm() {
  return render(
    <ConsultationProvider>
      <FormUserInfo />
    </ConsultationProvider>
  );
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Rut'), '12345678');
  await user.type(screen.getByLabelText('DV-Rut'), 'K');
  await user.type(screen.getByLabelText('Primer nombre'), 'Ana');
  await user.type(screen.getByLabelText('Apellido paterno'), 'Pérez');
  await user.type(screen.getByLabelText('Correo'), 'ana@test.com');
  fireEvent.change(screen.getByLabelText('Fecha nacimiento'), { target: { value: '1990-05-20' } });
  const [genderSelect, athleteSelect] = screen.getAllByRole('combobox');
  await user.selectOptions(genderSelect, 'FEMENINO');
  await user.selectOptions(athleteSelect, 'true');
}

beforeEach(() => {
  pushMock.mockClear();
});

describe('FormUserInfo', () => {
  it('submits valid data, persists it to context/localStorage and navigates to anamnesis', async () => {
    const user = userEvent.setup();
    renderForm();
    await fillRequiredFields(user);

    await user.click(screen.getByRole('button', { name: 'Siguiente' }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/consultation/anamnesis'));
    const stored = JSON.parse(localStorage.getItem('consulta_context')!);
    expect(stored.personalInfo).toMatchObject({
      firstName: 'Ana',
      paternalLastName: 'Pérez',
      email: 'ana@test.com',
      gender: 'FEMENINO',
      athlete: true,
    });
  });

  it('blocks submit and shows required-field errors when submitted empty', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: 'Siguiente' }));

    expect(pushMock).not.toHaveBeenCalled();
    const requiredErrors = await screen.findAllByText('Campo requerido');
    expect(requiredErrors.length).toBeGreaterThanOrEqual(4);
    expect(localStorage.getItem('consulta_context')).toBeNull();
  });

  it('shows "Rut demasiado corto" when the rut has fewer than 7 digits', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText('Rut'), '123456');

    await user.click(screen.getByRole('button', { name: 'Siguiente' }));

    expect(await screen.findByText('Rut demasiado corto')).toBeInTheDocument();
  });

  it('shows "Rut demasiado largo" when the rut has more than 8 digits', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText('Rut'), '123456789');

    await user.click(screen.getByRole('button', { name: 'Siguiente' }));

    expect(await screen.findByText('Rut demasiado largo')).toBeInTheDocument();
  });

  it('only offers MASCULINO and FEMENINO as gender options (the "OTRO" option was removed)', () => {
    renderForm();
    const [genderSelect] = screen.getAllByRole('combobox');
    const values = Array.from(genderSelect.querySelectorAll('option')).map((o) => (o as HTMLOptionElement).value);
    expect(values).toEqual(['MASCULINO', 'FEMENINO']);
  });

  it('documents the current athlete select: two options share value="false" (intended, not a bug to fix)', () => {
    renderForm();
    const [, athleteSelect] = screen.getAllByRole('combobox');
    const values = Array.from(athleteSelect.querySelectorAll('option')).map((o) => (o as HTMLOptionElement).value);
    expect(values).toEqual(['false', 'false', 'true']);
  });
});
