import type { Page } from '@playwright/test';
import type { AnamnesisDto, MeasurementsDto, PersonalInfoDto } from '../../src/features/consultation/dtos/consultation.dto';

// Datos de los pasos de la consulta tal como los envía el frontend: pasan la validación del backend real,
// que exige todas las propiedades (aunque sean null) y rechaza las desconocidas.
export const VALID_PERSONAL_INFO: PersonalInfoDto = {
  rut: null,
  dvRut: null,
  firstName: 'Ana',
  middleName: null,
  paternalLastName: 'Pérez',
  maternalLastName: null,
  gender: 'FEMENINO',
  athlete: false,
  email: 'ana@test.com',
  dateOfBirth: new Date('1990-05-20T00:00:00.000Z'),
};
export const EMPTY_ANAMNESIS: AnamnesisDto = { goals: null, clinical: null, dietary: null, lifestyle: null };
export const VALID_MEASUREMENTS: MeasurementsDto = { weight: 65, height: 165, somatotype: 'MESO' };

// Siembra localStorage ANTES de que la app arranque (page.addInitScript corre antes que
// cualquier script de la página), para que ConsultationProvider hidrate con estos datos.
export async function seedConsultationContext(
  page: Page,
  data: Partial<{
    personalInfo: PersonalInfoDto | null;
    anamnesis: AnamnesisDto | null;
    measurements: MeasurementsDto | null;
    nutritionPlan: unknown;
  }>
) {
  const payload = JSON.stringify({
    personalInfo: null,
    anamnesis: null,
    measurements: null,
    nutritionPlan: null,
    ...data,
  });
  await page.addInitScript((json) => {
    window.localStorage.setItem('consulta_context', json);
  }, payload);
}
