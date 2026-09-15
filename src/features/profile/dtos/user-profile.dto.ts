// Espejo de UserProfileResponseDto / UpdateUserProfileDtoImpl en el backend
// (nutricionista-virtual-back/src/presentation/user/dto/user-profile.dto.ts).

export interface UserProfileDto {
    firstName: string | null;
    paternalLastName: string | null;
    dateOfBirth: string | null; // ISO
    email: string | null;
}

export interface UpdateUserProfileDto {
    firstName: string;
    paternalLastName: string;
    dateOfBirth: string; // ISO
}
