// Subconjunto de ProfileDto / UpdateProfileDtoImpl del backend (GET y PATCH /me, ver
// fitplan-back/src/modules/identity/dto/profile.dto.ts): la pantalla de perfil solo
// usa y edita estos campos. PATCH /me acepta cualquier subconjunto de campos.

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
