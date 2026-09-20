import { test, expect } from '@playwright/test';
import { mockOrderStatusSequence } from './helpers/mock-backend';
import { nutritionPlanMock } from '../src/features/nutrition-plan/dtos/nutrition-plan.mock';

// El polling real es cada 4s (ver POLLING_INTERVAL_MS en /ordenes/[id]/page.tsx). Se usa tiempo
// real de Playwright en vez de page.clock: el mock de red resuelve como una promesa nativa que
// el reloj falso de Playwright no está garantizado a esperar, así que esperar tiempo real es
// más simple y confiable aquí (la lógica exacta del polling/aviso de demora ya está cubierta
// de forma determinista con fake timers en el test unitario de esta página).
test.describe('Order status & plan', () => {
  test('polls until completion and shows the download button', async ({ page }) => {
    await mockOrderStatusSequence(page, [
      { paymentStatus: 'pagado', generationStatus: 'generando', planJson: null },
      { paymentStatus: 'pagado', generationStatus: 'completado', planJson: nutritionPlanMock },
    ]);

    await page.goto('/ordenes/order-e2e-123');
    await expect(page.getByText(/Estamos generando tu plan nutricional/)).toBeVisible();

    await expect(page.getByText('¡Tu plan nutricional está listo!')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('link', { name: /Descargar/ })).toBeVisible();
  });

  test('shows a delay notice once generation has been running past 45 seconds', async ({ page }) => {
    test.setTimeout(70_000);
    await mockOrderStatusSequence(page, [{ paymentStatus: 'pagado', generationStatus: 'generando', planJson: null }]);

    await page.goto('/ordenes/order-e2e-123');

    await expect(page.getByText(/tardando más de lo normal/)).toBeVisible({ timeout: 60_000 });
  });

  test('shows a reassuring error state and no download button when generation fails', async ({ page }) => {
    await mockOrderStatusSequence(page, [{ paymentStatus: 'pagado', generationStatus: 'error', planJson: null }]);

    await page.goto('/ordenes/order-e2e-123');

    await expect(page.getByText('Tu pago está a salvo')).toBeVisible();
    await expect(page.getByRole('link', { name: /Descargar/ })).toHaveCount(0);
  });
});
