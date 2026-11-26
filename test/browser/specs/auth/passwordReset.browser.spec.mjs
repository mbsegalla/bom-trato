import { test, expect, success } from '../../support/api.fixture.mjs';

const token = 'a'.repeat(43);
const password = 'Fixture!password123';
const endpoint = '/api/auth/reset-password';

test('rejects duplicate reset tokens without submitting a password', async ({ page, api }) => {
  await page.goto('/reset-password#token=' + token + '&token=' + token);

  await expect(page.getByRole('heading', { name: 'Precisamos de um novo link' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Solicitar novo link' })).toHaveAttribute('href', '/forgot-password');
  await expect(page.getByLabel('Nova senha', { exact: true })).toHaveCount(0);
  expect(api.calls).toHaveLength(0);
});

test('validates password confirmation, sends CSRF-protected data once and clears the reset fragment', async ({ page, api }) => {
  api.respond('GET', '/api/auth/csrf', () => success({ csrfToken: 'fixture-csrf' }));
  api.respond('POST', endpoint, () => success({}));

  await page.goto('/reset-password#token=' + token);

  const newPassword = page.getByLabel('Nova senha', { exact: true });
  const confirmation = page.getByLabel('Confirme a nova senha', { exact: true });

  await expect(newPassword).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Mostrar senha' }).click();
  await expect(newPassword).toHaveAttribute('type', 'text');
  await expect(confirmation).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Ocultar senha' }).click();
  await newPassword.fill(password);
  await confirmation.fill('Fixture!different123');
  await page.getByRole('button', { name: 'Criar nova senha' }).click();

  await expect(page.getByRole('alert').filter({ hasText: 'As senhas não coincidem.' })).toBeVisible();
  expect(api.calls).toHaveLength(0);

  await confirmation.fill(password);
  await page.getByRole('button', { name: 'Criar nova senha' }).click();

  await expect(page.getByRole('heading', { name: 'Senha alterada' })).toBeVisible();
  await expect(page).toHaveURL(/\/reset-password$/);
  await expect(page.getByRole('link', { name: 'Entrar na minha conta' })).toHaveAttribute('href', '/login');

  const calls = api.calls.filter((call) => call.path === endpoint);

  expect(calls).toHaveLength(1);
  expect(calls[0].body).toEqual({ token, password });
  expect(calls[0].headers['x-csrf-token']).toBe('fixture-csrf');
});

test('returns to recovery when the backend rejects an expired or used token', async ({ page, api }) => {
  api.respond('GET', '/api/auth/csrf', () => success({ csrfToken: 'fixture-csrf' }));
  api.respond('POST', endpoint, () => ({ status: 401, json: { success: false } }));

  await page.goto('/reset-password#token=' + token);
  await page.getByLabel('Nova senha', { exact: true }).fill(password);
  await page.getByLabel('Confirme a nova senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Criar nova senha' }).click();

  await expect(page.getByRole('heading', { name: 'Precisamos de um novo link' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Criar nova senha' })).toHaveCount(0);
  expect(api.calls.filter((call) => call.path === endpoint)).toHaveLength(1);
});
