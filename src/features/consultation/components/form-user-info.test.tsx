import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormUserInfo } from './form-user-info';
import { ConsultationProvider } from '@/shared';
import { updateProfileAction } from '@/shared/auth/profile.actions';
import type { PerfilStatus } from '@/shared/auth/profile.actions';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }) }));

vi.mock('@/shared/auth/profile.actions', () => ({ updateProfileAction: vi.fn() }));
const mockedUpdateProfileAction = vi.mocked(updateProfileAction);

const baseProfile: PerfilStatus = {
  profileComplete: true,
  firstName: null,
  middleName: null,
  paternalLastName: null,
  maternalLastName: null,
  gender: null,
  dateOfBirth: null,
  athlete: false,
  email: 'ana@test.com',
  rut: null,
  rutCheckDigit: null,
};

function renderForm(profile: PerfilStatus | null = baseProfile, nextHref?: string) {
  return render(
    <ConsultationProvider>
      <FormUserInfo profile={profile} nextHref={nextHref} />
    </ConsultationProvider>
  );
}

async function fillRequiredFields(
  user: ReturnType<typeof userEvent.setup>,
  sportLevel: 'none' | 'recreational' | 'professional' = 'professional',
) {
  await user.type(screen.getByLabelText('Primer nombre'), 'Ana');
  await user.type(screen.getByLabelText('Apellido paterno'), 'Pérez');
  fireEvent.change(screen.getByLabelText('Fecha nacimiento'), { target: { value: '1990-05-20' } });
  const [genderSelect, athleteSelect] = screen.getAllByRole('combobox');
  await user.selectOptions(genderSelect, 'FEMENINO');
  await user.selectOptions(athleteSelect, sportLevel);
}

beforeEach(() => {
  pushMock.mockClear();
  mockedUpdateProfileAction.mockReset();
});

describe('FormUserInfo', () => {
  it('submits valid data, persists the profile to the backend and navigates to anamnesis', async () => {
    mockedUpdateProfileAction.mockResolvedValue({ ok: true, data: { ...baseProfile, firstName: 'Ana' } });
    const user = userEvent.setup();
    renderForm();
    await fillRequiredFields(user);

    await user.click(screen.getByRole('button', { name: 'Siguiente' }));

    await waitFor(() => expect(mockedUpdateProfileAction).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: 'Ana', paternalLastName: 'Pérez', gender: 'FEMENINO', athlete: true }),
    ));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/consulta/anamnesis'));
    const stored = JSON.parse(localStorage.getItem('consulta_context')!);
    expect(stored.personalInfo).toMatchObject({
      firstName: 'Ana',
      paternalLastName: 'Pérez',
      email: 'ana@test.com', // viene del perfil sincronizado, no de un input editable
      gender: 'FEMENINO',
      athlete: true,
    });
  });

  it('navigates to nextHref (/inicio) when it only came to complete the personal info after logging in', async () => {
    mockedUpdateProfileAction.mockResolvedValue({ ok: true, data: { ...baseProfile, firstName: 'Ana' } });
    const user = userEvent.setup();
    renderForm(baseProfile, '/inicio');
    await fillRequiredFields(user);

    await user.click(screen.getByRole('button', { name: 'Siguiente' }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/inicio'));
    expect(pushMock).not.toHaveBeenCalledWith('/consulta/anamnesis');
  });

  it('does not navigate and shows the backend error when updateProfileAction fails', async () => {
    mockedUpdateProfileAction.mockResolvedValue({ ok: false, message: 'Error al actualizar' });
    const user = userEvent.setup();
    renderForm();
    await fillRequiredFields(user);

    await user.click(screen.getByRole('button', { name: 'Siguiente' }));

    await waitFor(() => expect(mockedUpdateProfileAction).toHaveBeenCalled());
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('blocks submit and shows required-field errors when submitted empty', async () => {
    const user = userEvent.setup();
    renderForm(null);

    await user.click(screen.getByRole('button', { name: 'Siguiente' }));

    expect(pushMock).not.toHaveBeenCalled();
    expect(mockedUpdateProfileAction).not.toHaveBeenCalled();
    const requiredErrors = await screen.findAllByText('Campo requerido');
    expect(requiredErrors.length).toBeGreaterThanOrEqual(3); // firstName, paternalLastName, dateOfBirth
  });

  it('renders the email field pre-filled from the profile and disabled', () => {
    renderForm();
    const emailInput = screen.getByLabelText('Correo') as HTMLInputElement;
    expect(emailInput).toBeDisabled();
    expect(emailInput.value).toBe('ana@test.com');
  });

  it('only offers MASCULINO and FEMENINO as gender options (the "OTRO" option was removed)', () => {
    renderForm(null);
    const [genderSelect] = screen.getAllByRole('combobox');
    const values = Array.from(genderSelect.querySelectorAll('option')).map((o) => (o as HTMLOptionElement).value);
    expect(values).toEqual(['MASCULINO', 'FEMENINO']);
  });

  it('offers three distinct sport levels in the athlete select', () => {
    renderForm(null);
    const [, athleteSelect] = screen.getAllByRole('combobox');
    const values = Array.from(athleteSelect.querySelectorAll('option')).map((o) => (o as HTMLOptionElement).value);
    expect(values).toEqual(['none', 'recreational', 'professional']);
  });

  it.each([
    ['none', false],
    ['recreational', false],
    ['professional', true],
  ] as const)('maps sport level "%s" to athlete=%s', async (sportLevel, athlete) => {
    mockedUpdateProfileAction.mockResolvedValue({ ok: true, data: baseProfile });
    const user = userEvent.setup();
    renderForm();
    await fillRequiredFields(user, sportLevel);

    await user.click(screen.getByRole('button', { name: 'Siguiente' }));

    await waitFor(() => expect(mockedUpdateProfileAction).toHaveBeenCalledWith(expect.objectContaining({ athlete })));
    await waitFor(() => expect(pushMock).toHaveBeenCalled());
    expect(JSON.parse(localStorage.getItem('consulta_context')!).personalInfo.athlete).toBe(athlete);
  });

  it('prefills the athlete select from the profile (true → professional, false → none)', () => {
    const { unmount } = renderForm({ ...baseProfile, athlete: true });
    expect((screen.getAllByRole('combobox')[1] as HTMLSelectElement).value).toBe('professional');
    unmount();

    renderForm({ ...baseProfile, athlete: false });
    expect((screen.getAllByRole('combobox')[1] as HTMLSelectElement).value).toBe('none');
  });
});
