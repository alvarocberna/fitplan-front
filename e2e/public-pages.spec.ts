import { test, expect } from './fixtures';
import { mockCmsArticles, mockCmsTestimonials, mockFailure } from './helpers/mock-backend';

const ARTICLES = {
  id: 'coleccion-1',
  titulo: 'Artículos de nutrición',
  descripcion: 'Lecturas para comer mejor',
  activo: true,
  aprobar: false,
  notificacion: false,
  proyecto_id: 'e2e-test-project',
  articulo: [
    {
      id: 'articulo-1',
      nro_articulo: 1,
      titulo: 'Cómo hidratarse',
      subtitulo: 'Antes, durante y después',
      autor: 'Equipo Fitplan',
      fecha_publicacion: new Date('2026-05-10T12:00:00.000Z'),
      fecha_actualizacion: null,
      status: 'approved',
      activo: true,
      slug: 'como-hidratarse',
      image_url: null,
      image_alt: null,
      image_position: null,
      autor_id: 'autor-1',
      proyecto_id: 'e2e-test-project',
      sec_articulo: [],
    },
  ],
};

const TESTIMONIALS = {
  id: 'coleccion-2',
  titulo: 'Lo que dicen de nosotros',
  descripcion: 'Experiencias de pacientes',
  activo: true,
  aprobar: false,
  notificacion: false,
  proyecto_id: 'e2e-test-project',
  testimonio: [
    {
      id: 'testimonio-1',
      nombre: 'Luisa',
      apellido: 'Soto',
      correo: 'luisa@test.com',
      descripcion: 'Me ayudó a ordenar mi alimentación',
      calificacion: 5,
      status: 'approved',
      fecha_creacion: new Date('2026-05-10T12:00:00.000Z'),
      testimonios_id: 'coleccion-2',
    },
    {
      id: 'testimonio-2',
      nombre: 'Pendiente',
      apellido: 'DeRevisar',
      correo: 'pendiente@test.com',
      descripcion: 'Este testimonio aún no se aprueba',
      calificacion: 1,
      status: 'pending',
      fecha_creacion: new Date('2026-05-11T12:00:00.000Z'),
      testimonios_id: 'coleccion-2',
    },
  ],
};

test.describe('Sin sesión', () => {
  test.use({ authenticated: false });

  test('la landing lleva "Iniciar Consulta" al login, con vuelta a la consulta', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /Nutrición\s+personalizada/ })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Iniciar Consulta' }).first()).toHaveAttribute(
      'href',
      '/login?return_to=%2Fconsulta%2Finicio',
    );
  });

  test('/login ofrece las opciones de ingreso y conserva return_to', async ({ page }) => {
    await page.goto('/login?return_to=/consulta/inicio');

    const options = page.getByRole('link', { name: 'Registro' });
    await expect(options).toHaveAttribute('href', /\/api\/cognito\/login\?.*return_to=%2Fconsulta%2Finicio/);
  });

  test('/login ignora un return_to externo (no hay open redirect)', async ({ page }) => {
    await page.goto('/login?return_to=https://sitio-malicioso.example');

    await expect(page.getByRole('link', { name: 'Registro' })).toBeVisible();
    await expect(page.locator('a[href*="sitio-malicioso"]')).toHaveCount(0);
  });

  test('/login solo muestra mensajes de error conocidos', async ({ page }) => {
    await page.goto('/login?error=session_expired');
    await expect(page.getByRole('alert').filter({ hasText: 'Tu sesión expiró' })).toBeVisible();

    await page.goto('/login?error=<b>mensaje-inyectado</b>');
    await expect(page.getByRole('link', { name: 'Registro' })).toBeVisible();
    await expect(page.getByText('mensaje-inyectado')).toHaveCount(0);
  });

  test('la política de privacidad es pública', async ({ page }) => {
    await page.goto('/politica-de-privacidad');

    await expect(page).toHaveURL(/\/politica-de-privacidad$/);
    await expect(page.getByRole('heading').first()).toBeVisible();
  });

  test('/articulos lista los artículos del CMS', async ({ page }) => {
    await mockCmsArticles(ARTICLES);
    await page.goto('/articulos');

    await expect(page.getByText('Artículos de nutrición')).toBeVisible();
    await expect(page.getByText('Cómo hidratarse')).toBeVisible();
  });

  test('/articulos sin artículos se muestra sin errores', async ({ page }) => {
    await page.goto('/articulos');

    await expect(page.getByRole('contentinfo')).toBeVisible();
    await expect(page.getByText('Cómo hidratarse')).toHaveCount(0);
  });

  test('/testimonios muestra solo los testimonios aprobados', async ({ page }) => {
    await mockCmsTestimonials(TESTIMONIALS);
    await page.goto('/testimonios');

    await expect(page.getByText('Me ayudó a ordenar mi alimentación')).toBeVisible();
    await expect(page.getByText('Este testimonio aún no se aprueba')).toHaveCount(0);
  });

  test.describe('con el CMS caído', () => {
    // la página responde 500 y el navegador lo registra
    test.use({ expectedBrowserErrors: /react\.dev\/errors\/441|status of 500/ });
    test.skip(process.env.E2E_DEV === 'true', 'el mensaje solo se oculta en un build de producción');

    test('/articulos no expone el detalle del error', async ({ page }) => {
      await mockFailure('cmsArticles', { status: 500, message: 'detalle interno del cms' });
      await page.goto('/articulos');

      await expect(page.getByRole('contentinfo')).toBeVisible();
      await expect(page.getByText('detalle interno del cms')).toHaveCount(0);
    });
  });
});

test.describe('Con sesión', () => {
  test('la landing lleva "Iniciar Consulta" directo a la consulta', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: 'Iniciar Consulta' }).first()).toHaveAttribute('href', '/consulta/inicio');
  });
});
