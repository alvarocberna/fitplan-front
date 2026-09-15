import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileService } from './profile.service';
import { getUserProfileAction, updateUserProfileAction } from './profile.actions';
import type { UpdateUserProfileDto } from '../dtos/user-profile.dto';

vi.mock('./profile.actions', () => ({
  getUserProfileAction: vi.fn(),
  updateUserProfileAction: vi.fn(),
}));

const mockedGetUserProfileAction = vi.mocked(getUserProfileAction);
const mockedUpdateUserProfileAction = vi.mocked(updateUserProfileAction);

beforeEach(() => {
  mockedGetUserProfileAction.mockReset();
  mockedUpdateUserProfileAction.mockReset();
});

describe('ProfileService', () => {
  it('getProfile returns the unwrapped profile on success', async () => {
    mockedGetUserProfileAction.mockResolvedValue({
      ok: true,
      data: { firstName: 'Ana', paternalLastName: 'Pérez', dateOfBirth: '1990-05-20', email: 'ana@test.com' },
    });

    const result = await ProfileService.getProfile();

    expect(mockedGetUserProfileAction).toHaveBeenCalledWith();
    expect(result).toEqual({ firstName: 'Ana', paternalLastName: 'Pérez', dateOfBirth: '1990-05-20', email: 'ana@test.com' });
  });

  it('getProfile throws with the backend message when the action fails', async () => {
    mockedGetUserProfileAction.mockResolvedValue({ ok: false, message: 'No se pudo obtener el perfil' });

    await expect(ProfileService.getProfile()).rejects.toThrow('No se pudo obtener el perfil');
  });

  it('updateProfile posts the update payload and returns the unwrapped profile', async () => {
    const dto: UpdateUserProfileDto = { firstName: 'Ana', paternalLastName: 'Pérez', dateOfBirth: '1990-05-20T00:00:00.000Z' };
    mockedUpdateUserProfileAction.mockResolvedValue({
      ok: true,
      data: { firstName: 'Ana', paternalLastName: 'Pérez', dateOfBirth: '1990-05-20T00:00:00.000Z', email: 'ana@test.com' },
    });

    const result = await ProfileService.updateProfile(dto);

    expect(mockedUpdateUserProfileAction).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ firstName: 'Ana', paternalLastName: 'Pérez', dateOfBirth: '1990-05-20T00:00:00.000Z', email: 'ana@test.com' });
  });

  it('updateProfile throws with the backend message when the action fails', async () => {
    mockedUpdateUserProfileAction.mockResolvedValue({ ok: false, message: 'Error al actualizar' });

    await expect(
      ProfileService.updateProfile({ firstName: 'Ana', paternalLastName: 'Pérez', dateOfBirth: '1990-05-20T00:00:00.000Z' }),
    ).rejects.toThrow('Error al actualizar');
  });
});
