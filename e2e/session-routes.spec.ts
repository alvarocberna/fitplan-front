import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';
import { mockOrderStatusSequence } from './helpers/mock-backend';

const FLOW_PATHS = ['/consulta/inicio', '/consulta/anamnesis', '/pago/order-e2e-123', '/ordenes/order-e2e-123'];

// src/proxy.ts exige sesión válida en /consulta/*, /pago/*, /ordenes/*, /panel, /planes, /mediciones y /perfil.
test.describe('Session gating (sin sesión)', () => {
  test.use({ authenticated: false });

  for (const path of [...FLOW_PATHS, '/panel', '/planes', '/mediciones', '/perfil']) {
    test(`redirects ${path} to /login`, async ({ page }) => {
      await page.goto(path);

      await expect(page).toHaveURL(/\/login$/);
    });
  }

  test('keeps /consulta (root, empty page) public', async ({ page }) => {
    await page.goto('/consulta');

    await expect(page).toHaveURL(/\/consulta$/);
  });
});

// /consulta/*, /pago/* y /ordenes/* viven en el route group (sesion): barra superior (logo +
// "Nueva consulta"), sidebar de sesión acoplado por defecto (solo el ícono para desacoplarlo) y sin
// el navbar de la landing.
//
// Los enlaces Home/Planes/Mediciones/Perfil/Cerrar sesión existen dos veces en el DOM: en el sidebar (md+) y en el menú
// móvil de la barra superior (`md:hidden`). En el viewport de escritorio de Playwright el móvil está
// oculto (los selectores por rol lo ignoran), pero igual se acota al sidebar / a la barra superior.
const sidebarOf = (page: Page) =>
  page.getByRole('navigation').filter({ has: page.getByRole('button', { name: /menú lateral/ }) });
const topbarOf = (page: Page) => page.getByRole('banner');

test.describe('Session layout (con sesión)', () => {
  for (const path of FLOW_PATHS) {
    test(`${path} shows the topbar, the docked session sidebar and no landing navbar`, async ({ page }) => {
      // /ordenes/[id] hace polling al montar; el resto de las rutas no llama a este endpoint
      await mockOrderStatusSequence([
        { paymentStatus: 'PAID', generationStatus: 'GENERATING', planJson: null, pdfUrl: null, thumbnailUrl: null },
      ]);
      await page.goto(path);

      // barra superior: siempre visible, no depende de acoplar el sidebar
      await expect(topbarOf(page).getByRole('link', { name: 'Nuvi' })).toHaveAttribute('href', '/panel');
      await expect(topbarOf(page).getByRole('link', { name: 'Nueva consulta' })).toBeVisible();

      await expect(page.getByRole('button', { name: 'Desacoplar menú lateral' })).toBeVisible();
      await expect(sidebarOf(page).getByRole('link', { name: 'Home', exact: true })).toBeHidden();
      // sin navbar de la landing: su CTA "Iniciar sesión" (→ /login) no está en el DOM. Ojo: el link
      // a `/#plan-personal` ya no sirve para detectarlo, porque el Footer (que SesionShell monta) lo repite.
      await expect(page.locator('a[href="/login"]')).toHaveCount(0);

      // footer propio de SesionShell, y uno solo (FooterGate no duplica el del layout raíz)
      await expect(page.getByRole('contentinfo')).toHaveCount(1);
      await expect(page.getByRole('contentinfo').locator('a[href="/#plan-personal"]')).toHaveCount(1);
    });
  }

  test('undocks the sidebar to reveal its links and docks it again', async ({ page }) => {
    await page.goto('/pago/order-e2e-123');
    const sidebar = sidebarOf(page);
    const newConsultation = topbarOf(page).getByRole('link', { name: 'Nueva consulta' });

    await expect(newConsultation).toHaveAttribute('href', '/consulta/anamnesis');

    await page.getByRole('button', { name: 'Desacoplar menú lateral' }).click();
    // exact: true, para que 'Home' no matchee por substring con otros links de la página
    await expect(sidebar.getByRole('link', { name: 'Home', exact: true })).toHaveAttribute('href', '/panel');
    await expect(sidebar.getByRole('link', { name: 'Planes', exact: true })).toHaveAttribute('href', '/planes');
    await expect(sidebar.getByRole('link', { name: 'Mediciones', exact: true })).toHaveAttribute('href', '/mediciones');
    await expect(sidebar.getByRole('link', { name: 'Perfil' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Cerrar sesión' })).toBeVisible();
    // "Nueva consulta" ya no es un ítem del sidebar
    await expect(sidebar.getByRole('link', { name: 'Nueva consulta' })).toHaveCount(0);
    await expect(newConsultation).toBeVisible();

    await page.getByRole('button', { name: 'Acoplar menú lateral' }).click();
    await expect(sidebar.getByRole('link', { name: 'Home', exact: true })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Desacoplar menú lateral' })).toBeVisible();
    // acoplar el sidebar no toca la barra superior
    await expect(newConsultation).toBeVisible();
  });

  test('on small screens the sidebar is gone and its options move to the topbar menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/pago/order-e2e-123');

    await expect(page.getByRole('button', { name: /menú lateral/ })).toBeHidden();

    const userMenu = page.getByRole('navigation', { name: 'Menú de usuario' });
    await expect(userMenu.getByRole('link', { name: 'Perfil' })).toBeVisible();
    await expect(userMenu.getByRole('link', { name: 'Home', exact: true })).toHaveAttribute('href', '/panel');
    await expect(userMenu.getByRole('link', { name: 'Planes', exact: true })).toHaveAttribute('href', '/planes');
    await expect(userMenu.getByRole('link', { name: 'Mediciones', exact: true })).toHaveAttribute('href', '/mediciones');
    await expect(userMenu.getByRole('link', { name: 'Cerrar sesión' })).toBeVisible();
    await expect(topbarOf(page).getByRole('link', { name: 'Nueva consulta' })).toBeVisible();
  });
});
