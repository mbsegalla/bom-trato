import { test, expect, success } from '../../support/api.fixture.mjs';

test('masks the password, supports visibility toggle and navigates to account recovery', async ({ page, api }) => {
  await page.goto('/login');
  const password = page.getByLabel('Senha', { exact: true });

  await expect(password).toHaveAttribute('type', 'password');

  await page.getByRole('button', { name: 'Mostrar senha' }).click();

  await expect(password).toHaveAttribute('type', 'text');

  await page.getByRole('button', { name: 'Ocultar senha' }).click();

  await expect(password).toHaveAttribute('type', 'password');

  await page.getByRole('link', { name: 'Esqueci minha senha' }).click();

  await expect(page).toHaveURL(/\/forgot-password$/);
  expect(api.calls).toHaveLength(0);
});

test('shows invalid credentials, preserves the login page and submits CSRF-protected data', async ({ page, api }) => {
  api.respond('GET', '/api/auth/csrf', () => success({ csrfToken: 'fixture-csrf' }));
  api.respond('POST', '/api/auth/login', () => ({
    status: 401,
    json: {
      statusCode: 401,
      success: false,
      error: { code: 'INVALID_CREDENTIALS' }
    },
  }));

  await page.goto('/login');
  await page.getByLabel('E-mail', { exact: true }).fill('fixture@example.invalid');
  await page.getByLabel('Senha', { exact: true }).fill('Fixture!password123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();

  await expect(page.getByText('E-mail ou senha inválidos.', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeEnabled();

  const calls = api.calls.filter((call) => call.path === '/api/auth/login');

  expect(calls).toHaveLength(1);
  expect(calls[0].body).toEqual({ email: 'fixture@example.invalid', password: 'Fixture!password123' });
  expect(calls[0].headers['x-csrf-token']).toBe('fixture-csrf');
});
