import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileForm } from './profile-form.component';
import { ProfileService } from '../services/profile.service';
import type { UserProfileDto } from '../dtos/user-profile.dto';

vi.mock('../services/profile.service', () => ({ ProfileService: { updateProfile: vi.fn() } }));
const mockedUpdateProfile = vi.mocked(ProfileService.updateProfile);

const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();
vi.mock('react-toastify', () => ({
  toast: { success: (...args: unknown[]) => toastSuccessMock(...args), error: (...args: unknown[]) => toastErrorMock(...args) },
}));

const baseProfile: UserProfileDto = {
  firstName: 'Ana',
  paternalLastName: 'Pérez',
  dateOfBirth: '1990-05-20T00:00:00.000Z',
  email: 'ana@test.com',
};

beforeEach(() => {
  mockedUpdateProfile.mockReset();
  toastSuccessMock.mockClear();
  toastErrorMock.mockClear();
});

describe('ProfileForm', () => {
  it('pre-fills the fields from the profile prop, with email read-only', () => {
    render(<ProfileForm profile={baseProfile} />);

    expect(screen.getByLabelText('Nombre')).toHaveValue('Ana');
    expect(screen.getByLabelText('Apellido')).toHaveValue('Pérez');
    expect(screen.getByLabelText('Fecha de nacimiento')).toHaveValue('1990-05-20');

    const emailInput = screen.getByLabelText('Correo') as HTMLInputElement;
    expect(emailInput).toBeDisabled();
    expect(emailInput.value).toBe('ana@test.com');
  });

  it('submits the edited fields, converts the date to ISO and shows a success toast', async () => {
    mockedUpdateProfile.mockResolvedValue({ ...baseProfile, firstName: 'Ana María' });
    const user = userEvent.setup();
    render(<ProfileForm profile={baseProfile} />);

    await user.clear(screen.getByLabelText('Nombre'));
    await user.type(screen.getByLabelText('Nombre'), 'Ana María');
    fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), { target: { value: '1991-06-21' } });

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() =>
      expect(mockedUpdateProfile).toHaveBeenCalledWith({
        firstName: 'Ana María',
        paternalLastName: 'Pérez',
        dateOfBirth: new Date('1991-06-21').toISOString(),
      }),
    );
    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledWith('Perfil actualizado correctamente'));
    expect(toastErrorMock).not.toHaveBeenCalled();
  });

  it('shows an error toast with the service message when updateProfile fails', async () => {
    mockedUpdateProfile.mockRejectedValue(new Error('Error al actualizar'));
    const user = userEvent.setup();
    render(<ProfileForm profile={baseProfile} />);

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(toastErrorMock).toHaveBeenCalledWith('Error al actualizar'));
    expect(toastSuccessMock).not.toHaveBeenCalled();
  });

  it('blocks submit and shows required-field errors when the editable fields are empty', async () => {
    const user = userEvent.setup();
    render(<ProfileForm profile={{ firstName: null, paternalLastName: null, dateOfBirth: null, email: 'ana@test.com' }} />);

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(mockedUpdateProfile).not.toHaveBeenCalled();
    const requiredErrors = await screen.findAllByText('Campo requerido');
    expect(requiredErrors).toHaveLength(3); // firstName, paternalLastName, dateOfBirth
  });
});
