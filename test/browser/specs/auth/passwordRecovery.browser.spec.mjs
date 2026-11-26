import { test, expect, success } from '../../support/api.fixture.mjs';

test('password recovery gives a non-enumerating response and persists the resend cooldown', async ({ page, api }) => {
  api.respond('GET', '/api/auth/csrf', () => success({ csrfToken: 'fixture-csrf' }));
  api.respond('POST', '/api/auth/forgot-password', () => success({}));
  await page.goto('/forgot-password');
  await page.getByLabel('E-mail', { exact: true }).fill('fixture@example.invalid');
  await page.getByRole('button', { name: 'Enviar link de recuperação' }).click();
  await expect(page.getByRole('heading', { name: 'Confira seu e-mail' })).toBeVisible();
  await expect(page.getByText('Se houver uma conta cadastrada', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: /Reenviar em/ })).toBeDisabled();
  await page.reload();
  await expect(page.getByRole('button', { name: /Enviar novamente em/ })).toBeDisabled();
  const calls = api.calls.filter((call) => call.path === '/api/auth/forgot-password');
  expect(calls).toHaveLength(1);
  expect(calls[0].body).toEqual({ email: 'fixture@example.invalid' });
  expect(calls[0].headers['x-csrf-token']).toBe('fixture-csrf');
});

test('rate-limited password recovery disables resubmission and keeps the form visible', async ({ page, api }) => {
  api.respond('GET', '/api/auth/csrf', () => success({ csrfToken: 'fixture-csrf' }));
  api.respond('POST', '/api/auth/forgot-password', () => ({
    status: 429, json: { statusCode: 429, success: false, error: { code: 'RATE_LIMITED' } },
  }));
  await page.goto('/forgot-password');
  await page.getByLabel('E-mail', { exact: true }).fill('fixture@example.invalid');
  await page.getByRole('button', { name: 'Enviar link de recuperação' }).click();
  await expect(page.getByRole('alert')).toContainText('Muitas tentativas');
  await expect(page.getByRole('button', { name: /Enviar novamente em/ })).toBeDisabled();
  expect(api.calls.filter((call) => call.path === '/api/auth/forgot-password')).toHaveLength(1);
});
