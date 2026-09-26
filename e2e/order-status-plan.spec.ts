import { test, expect } from './fixtures';
import { mockOrderStatusSequence } from './helpers/mock-backend';
import { nutritionPlanMock } from '../src/features/nutrition-plan/dtos/nutrition-plan.mock';

// URLs firmadas que el backend real devolvería una vez generado el plan. La miniatura es un data:
// URI (1x1 PNG) para no depender de la red: el CSP (img-src) permite `data:` y el bucket privado
// de planes solo se accede con URLs firmadas reales.
const PDF_URL = 'https://nutricionista-virtual-planes-pdfs.s3.us-east-1.amazonaws.com/plan-e2e.pdf?X-Amz-Signature=e2e';
const THUMBNAIL_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const GENERATING = { paymentStatus: 'PAID', generationStatus: 'GENERATING', planJson: null, pdfUrl: null, thumbnailUrl: null };
const COMPLETED = {
  paymentStatus: 'PAID',
  generationStatus: 'COMPLETED',
  planJson: nutritionPlanMock,
  pdfUrl: PDF_URL,
  thumbnailUrl: THUMBNAIL_URL,
};

// El polling real es cada 4s (ver POLLING_INTERVAL_MS en src/app/(sesion)/ordenes/[id]/page.tsx). Se
// usa tiempo real de Playwright en vez de page.clock: el backend falso responde desde otro proceso,
// que el reloj falso de Playwright no controla, así que esperar tiempo real es más simple y
// confiable aquí (la lógica exacta del polling/aviso de demora ya está cubierta de forma
// determinista con fake timers en el test unitario de esta página).
test.describe('Order status & plan', () => {
  test('polls until completion and shows the plan preview and download button', async ({ page }) => {
    await mockOrderStatusSequence([GENERATING, COMPLETED]);

    await page.goto('/ordenes/order-e2e-123');
    await expect(page.getByText(/Estamos generando tu plan nutricional/)).toBeVisible();

    await expect(page.getByText('¡Tu plan nutricional está listo!')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('img', { name: /Vista previa de tu plan nutricional/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Descargar/ })).toHaveAttribute('href', PDF_URL);
    // ya no se incrusta el PDF: solo miniatura + descarga
    await expect(page.locator('iframe')).toHaveCount(0);
  });

  test('shows a placeholder instead of the thumbnail when the plan has none', async ({ page }) => {
    await mockOrderStatusSequence([{ ...COMPLETED, thumbnailUrl: null }]);

    await page.goto('/ordenes/order-e2e-123');

    await expect(page.getByText('Vista previa no disponible')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('link', { name: /Descargar/ })).toHaveAttribute('href', PDF_URL);
  });

  test('shows a delay notice once generation has been running past 45 seconds', async ({ page }) => {
    test.setTimeout(70_000);
    await mockOrderStatusSequence([GENERATING]);

    await page.goto('/ordenes/order-e2e-123');

    await expect(page.getByText(/tardando más de lo normal/)).toBeVisible({ timeout: 60_000 });
  });

  test('shows a reassuring error state and no download button when generation fails', async ({ page }) => {
    await mockOrderStatusSequence([{ ...GENERATING, generationStatus: 'ERROR' }]);

    await page.goto('/ordenes/order-e2e-123');

    await expect(page.getByText('Tu pago está a salvo')).toBeVisible();
    await expect(page.getByRole('link', { name: /Descargar/ })).toHaveCount(0);
  });
});
