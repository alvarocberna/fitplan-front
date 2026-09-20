import { test, expect } from './fixtures';
import { mockChatFailure, mockChatTurn } from './helpers/mock-backend';
import { seedConsultationContext } from './helpers/seed-context';

const EMPTY_ANAMNESIS = { goals: null, clinical: null, dietary: null, lifestyle: null };

test.describe('Consultation - anamnesis chat', () => {
  test('sends messages, reaches completion and advances to physical assessment', async ({ page }) => {
    await seedConsultationContext(page, { personalInfo: { firstName: 'Ana' } });
    await mockChatTurn([
      { reply: 'Cuéntame más', titleReply: 'Objetivos', anamnesis: EMPTY_ANAMNESIS, isComplete: false },
      {
        reply: 'Listo, tengo suficiente información',
        titleReply: 'Resumen',
        anamnesis: { ...EMPTY_ANAMNESIS, goals: { primaryGoal: 'bajar de peso', secondaryGoal: null } },
        isComplete: true,
      },
    ]);

    await page.goto('/consulta/anamnesis');
    const textarea = page.getByPlaceholder(/Escribe tu respuesta/);

    await textarea.fill('Quiero bajar de peso');
    await textarea.press('Enter');
    await expect(page.getByText('Cuéntame más')).toBeVisible();

    await textarea.fill('Eso es todo por ahora');
    await textarea.press('Enter');
    await expect(page.getByRole('button', { name: 'Siguiente' })).toBeVisible();

    await page.getByRole('button', { name: 'Siguiente' }).click();

    await expect(page).toHaveURL(/\/consulta\/evaluacion-fisica$/);
    const stored = await page.evaluate(() => window.localStorage.getItem('consulta_context'));
    expect(JSON.parse(stored ?? '{}').anamnesis.goals.primaryGoal).toBe('bajar de peso');
  });

  test('shows an error toast without breaking the chat when the backend call fails', async ({ page }) => {
    await seedConsultationContext(page, { personalInfo: { firstName: 'Ana' } });
    await mockChatFailure('Error interno');

    await page.goto('/consulta/anamnesis');
    const textarea = page.getByPlaceholder(/Escribe tu respuesta/);
    await textarea.fill('Hola');
    await textarea.press('Enter');

    await expect(page.getByText('Error al enviar el mensaje')).toBeVisible();
    await expect(textarea).toBeEnabled();
    await expect(page).toHaveURL(/\/consulta\/anamnesis$/);
  });
});
