import { randomUUID } from 'node:crypto';

import { apiOrigin, apiResponse, expect, inspectAccount, test } from '../support/fullStack.fixture.mjs';

test('registers, verifies, activates a trial and restores real authenticated access', async ({ page }) => {
  const email = 'e2e-' + randomUUID() + '@example.com';
  const password = 'Fixture!Password123';
  const name = 'E2E Account';
  const businessName = 'E2E Service Business';
  const main = page.getByRole('main');
  const dashboard = main.getByRole('heading', { name: 'Seu dia, mais organizado.' });

  await test.step('Register through the real frontend and API', async () => {
    await page.goto('/register');
    await page.getByRole('checkbox').check();
    await page.getByLabel('Nome', { exact: true }).fill(name);
    await page.getByLabel('E-mail', { exact: true }).fill(email);
    await page.getByLabel('Senha', { exact: true }).fill(password);
    await page.getByLabel('Confirme sua senha', { exact: true }).fill(password);

    const response = apiResponse(page, 'POST', '/api/auth/register');

    await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
    expect((await response).status()).toBe(201);
    await expect(page).toHaveURL(/\/verify-email$/);
  });

  await test.step('Consume the actual encrypted verification email', async () => {
    const { link } = inspectAccount('verification-link', email);
    const response = apiResponse(page, 'POST', '/api/auth/verify-email');

    await page.goto(link);
    expect((await response).status()).toBe(200);
    await expect(page).toHaveURL(/\/onboarding(?:\?.*)?$/);
    await expect(main.getByRole('heading', { name: 'Seu negócio começa aqui' })).toBeVisible();

    const cookies = await page.context().cookies(apiOrigin);
    const refreshCookie = cookies.find((cookie) => cookie.name === 'bomTratoRefresh');

    expect(refreshCookie).toMatchObject({ httpOnly: true, sameSite: 'Lax' });
  });

  let organizationId;

  await test.step('Activate the real 14-day trial without checkout', async () => {
    await expect(
      main.getByText('14 dias gratuitos. Sem cartão de crédito e sem renovação automática.', { exact: true }),
    ).toBeVisible();
    await main.getByLabel('Nome do negócio', { exact: true }).fill('  ' + businessName + '  ');

    const response = apiResponse(page, 'POST', '/api/onboarding/business');

    await main.getByRole('button', { name: 'Começar minha avaliação gratuita', exact: true }).click();

    const result = await response;
    expect(result.status()).toBe(200);
    const { data } = await result.json();

    expect(data).toMatchObject({ step: 'APP', accessSource: 'TRIAL', trial: { active: true, remainingDays: 14 } });
    organizationId = data.organizationId;
    expect(organizationId).toMatch(/^[0-9a-f-]{36}$/);

    await expect(main.getByRole('heading', { name: 'Sua avaliação começou!' })).toBeVisible();
    await main.getByRole('link', { name: 'Ir para o Bom Trato', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(dashboard).toBeVisible();
  });

  await test.step('Restore the real session after reloading the application', async () => {
    const response = apiResponse(page, 'POST', '/api/auth/refresh');

    await page.reload();
    expect((await response).status()).toBe(200);
    await expect(dashboard).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('bom-trato:active-organization'))).toBe(organizationId);
  });

  await test.step('Reject an incorrect password and sign in again without the previous cookies', async () => {
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await page.goto('/login');
    await page.getByLabel('E-mail', { exact: true }).fill(email);
    await page.getByLabel('Senha', { exact: true }).fill('Fixture!WrongPassword');

    const invalid = apiResponse(page, 'POST', '/api/auth/login');

    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    expect((await invalid).status()).toBe(401);
    await expect(page.getByText('E-mail ou senha inválidos.', { exact: true })).toBeVisible();

    await page.getByLabel('Senha', { exact: true }).fill(password);

    const valid = apiResponse(page, 'POST', '/api/auth/login');

    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    expect((await valid).status()).toBe(200);
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(dashboard).toBeVisible();
  });

  await test.step('Verify persistent ownership, legal acceptance and billing invariants', () => {
    const state = inspectAccount('account-state', email);

    expect(state).toMatchObject({
      organizationId,
      organizationName: businessName,
      verified: true,
      setupCompleted: true,
      role: 'OWNER',
      activeTrial: true,
      stripeCustomerId: null,
      organizationCount: 1,
      trialCount: 1,
      subscriptionCount: 0,
      checkoutCount: 0,
      termsCount: 1,
      verifiedTokenCount: 1,
    });
    expect(Date.parse(state.trialExpiresAt) - Date.parse(state.trialStartsAt)).toBe(14 * 24 * 60 * 60 * 1000);
  });
});
