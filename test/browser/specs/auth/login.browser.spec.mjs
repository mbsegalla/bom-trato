import { expect, success, test } from '../../support/api.fixture.mjs';

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
      error: { code: 'INVALID_CREDENTIALS' },
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

test('preserves login throttling across reload and tabs while allowing password recovery', async ({ page, api }) => {
  api.respond('GET', '/api/auth/csrf', () => success({ csrfToken: 'fixture-csrf' }));
  api.respond('POST', '/api/auth/login', () => ({
    status: 429,
    headers: { 'Retry-After': '120' },
    json: { success: false },
  }));

  await page.goto('/login');
  await page.getByLabel('E-mail', { exact: true }).fill('fixture@example.invalid');
  await page.getByLabel('Senha', { exact: true }).fill('Fixture!password123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();

  const blocked = page.getByRole('button', { name: /Tentar novamente em/ });
  await expect(blocked).toBeDisabled();
  await expect(page.getByText('Limite de tentativas atingido')).toBeVisible();
  await page.reload();
  await expect(blocked).toBeDisabled();

  const other = await page.context().newPage();
  try {
    await other.goto('/login');
    await expect(other.getByRole('button', { name: /Tentar novamente em/ })).toBeDisabled();
  } finally {
    await other.close();
  }

  await page.getByRole('link', { name: 'Redefinir minha senha' }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
  await expect(page.getByRole('button', { name: 'Enviar link de recuperação' })).toBeEnabled();
  expect(api.calls.filter((call) => call.path === '/api/auth/login')).toHaveLength(1);
});
