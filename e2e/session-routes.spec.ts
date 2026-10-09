import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';
import { mockOrderStatusSequence } from './helpers/mock-backend';

const FLOW_PATHS = ['/consulta/inicio', '/consulta/anamnesis', '/pago/aaaaaaaa-0000-4000-8000-000000000123', '/ordenes/aaaaaaaa-0000-4000-8000-000000000123'];

// src/proxy.ts exige sesión válida en /consulta/*, /pago/*, /ordenes/*, /inicio, /planes, /mediciones y /perfil.
test.describe('Session gating (sin sesión)', () => {
  test.use({ authenticated: false });

  for (const path of [...FLOW_PATHS, '/inicio', '/planes', '/mediciones', '/perfil']) {
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
// Los enlaces Inicio/Planes/Mediciones/Perfil/Cerrar sesión existen dos veces en el DOM: en el sidebar (md+) y en el menú
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
      await expect(topbarOf(page).getByRole('link', { name: 'Fitplan' })).toHaveAttribute('href', '/inicio');
      await expect(topbarOf(page).getByRole('link', { name: 'Nueva consulta' })).toBeVisible();

      await expect(page.getByRole('button', { name: 'Desacoplar menú lateral' })).toBeVisible();
      await expect(sidebarOf(page).getByRole('link', { name: 'Inicio', exact: true })).toBeHidden();
      // sin navbar de la landing: su CTA "Iniciar sesión" (→ /login) no está en el DOM. Ojo: el link
      // a `/#plan-personal` ya no sirve para detectarlo, porque el Footer (que SesionShell monta) lo repite.
      await expect(page.locator('a[href="/login"]')).toHaveCount(0);

      // footer propio de SesionShell, y uno solo (FooterGate no duplica el del layout raíz)
      await expect(page.getByRole('contentinfo')).toHaveCount(1);
      await expect(page.getByRole('contentinfo').locator('a[href="/#plan-personal"]')).toHaveCount(1);
    });
  }

  test('undocks the sidebar to reveal its links and docks it again', async ({ page }) => {
    await page.goto('/pago/aaaaaaaa-0000-4000-8000-000000000123');
    const sidebar = sidebarOf(page);
    const newConsultation = topbarOf(page).getByRole('link', { name: 'Nueva consulta' });

    await expect(newConsultation).toHaveAttribute('href', '/consulta/anamnesis');

    await page.getByRole('button', { name: 'Desacoplar menú lateral' }).click();
    // exact: true, para que 'Inicio' no matchee por substring con otros links de la página
    await expect(sidebar.getByRole('link', { name: 'Inicio', exact: true })).toHaveAttribute('href', '/inicio');
    await expect(sidebar.getByRole('link', { name: 'Planes', exact: true })).toHaveAttribute('href', '/planes');
    await expect(sidebar.getByRole('link', { name: 'Mediciones', exact: true })).toHaveAttribute('href', '/mediciones');
    await expect(sidebar.getByRole('link', { name: 'Perfil' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Cerrar sesión' })).toBeVisible();
    // "Nueva consulta" ya no es un ítem del sidebar
    await expect(sidebar.getByRole('link', { name: 'Nueva consulta' })).toHaveCount(0);
    await expect(newConsultation).toBeVisible();

    await page.getByRole('button', { name: 'Acoplar menú lateral' }).click();
    await expect(sidebar.getByRole('link', { name: 'Inicio', exact: true })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Desacoplar menú lateral' })).toBeVisible();
    // acoplar el sidebar no toca la barra superior
    await expect(newConsultation).toBeVisible();
  });

  test('on small screens the navigation is a panel opened and closed with the menu button of the topbar', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/pago/aaaaaaaa-0000-4000-8000-000000000123');

    // el botón de acoplar/desacoplar es solo de escritorio
    await expect(page.getByRole('button', { name: /menú lateral/ })).toBeHidden();
    await expect(topbarOf(page).getByRole('link', { name: 'Nueva consulta' })).toBeVisible();

    const menu = page.locator('nav#sesion-nav');
    // cerrado por defecto: las opciones no se ven
    await expect(menu.getByRole('link', { name: 'Perfil' })).toBeHidden();

    await page.getByRole('button', { name: 'Abrir menú' }).click();
    await expect(menu.getByRole('link', { name: 'Perfil' })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Inicio', exact: true })).toHaveAttribute('href', '/inicio');
    await expect(menu.getByRole('link', { name: 'Planes', exact: true })).toHaveAttribute('href', '/planes');
    await expect(menu.getByRole('link', { name: 'Mediciones', exact: true })).toHaveAttribute('href', '/mediciones');
    await expect(menu.getByRole('link', { name: 'Cerrar sesión' })).toBeVisible();

    await page.getByRole('button', { name: 'Cerrar menú' }).click();
    await expect(menu.getByRole('link', { name: 'Perfil' })).toBeHidden();
  });

});
