import type { Page } from '@playwright/test';

// Siembra localStorage ANTES de que la app arranque (page.addInitScript corre antes que
// cualquier script de la página), para que ConsultationProvider hidrate con estos datos.
export async function seedConsultationContext(
  page: Page,
  data: Partial<{ personalInfo: unknown; anamnesis: unknown; measurements: unknown; nutritionPlan: unknown }>
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
