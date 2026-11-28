import { randomUUID } from 'node:crypto';

import { apiOrigin, apiResponse, expect, inspectAccount, test } from '../support/fullStack.fixture.mjs';

test('registers, verifies, activates a trial and restores real authenticated access', async ({ page, playwright }) => {
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

  await test.step('Recover the password using the real outbox and reject reused action tokens', async () => {
    await page.goto('about:blank');

    const client = page.context().request;
    const newPassword = 'Fixture!UpdatedPassword456';

    async function mutate(path, data = {}, accessToken, sessionClient = client, method = 'POST') {
      const csrf = await sessionClient.get(apiOrigin + '/api/auth/csrf', {
        headers: { Origin: 'http://127.0.0.1:3100' },
      });
      expect(csrf.status()).toBe(200);
      const { data: csrfData } = await csrf.json();

      return sessionClient.fetch(apiOrigin + '/api/auth/' + path, {
        method,
        ...(method === 'POST' ? { data } : {}),
        headers: {
          Origin: 'http://127.0.0.1:3100',
          'X-CSRF-Token': csrfData.csrfToken,
          ...(accessToken ? { Authorization: 'Bearer ' + accessToken } : {}),
        },
      });
    }

    const unknownEmail = 'e2e-' + randomUUID() + '@example.com';
    const unknown = await mutate('forgot-password', { email: unknownEmail });
    const known = await mutate('forgot-password', { email });
    expect(unknown.status()).toBe(202);
    expect(known.status()).toBe(202);
    const { data: knownMessage } = await known.json();
    const { data: unknownMessage } = await unknown.json();
    expect(knownMessage).toEqual(unknownMessage);

    const { link } = inspectAccount('reset-link', email);
    const token = new URLSearchParams(new URL(link).hash.slice(1)).get('token');
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);

    expect((await mutate('verify-email', { token })).status()).toBe(401);
    expect((await mutate('reset-password', { token, password: 'weak' })).status()).toBe(400);
    expect((await mutate('reset-password', { token, password: newPassword })).status()).toBe(204);
    expect((await mutate('reset-password', { token, password })).status()).toBe(401);
    expect((await mutate('login', { email, password })).status()).toBe(401);

    const login = await mutate('login', { email, password: newPassword });
    expect(login.status()).toBe(200);
    const { data } = await login.json();
    const headers = { Authorization: 'Bearer ' + data.accessToken };

    expect((await client.get(apiOrigin + '/api/auth/me', { headers })).status()).toBe(200);
    const sessions = await client.get(apiOrigin + '/api/auth/sessions', { headers });
    expect(sessions.status()).toBe(200);
    const { data: activeSessions } = await sessions.json();
    expect(activeSessions.filter((session) => session.current)).toHaveLength(1);

    const secondClient = await playwright.request.newContext();

    try {
      const secondLogin = await mutate('login', { email, password: newPassword }, undefined, secondClient);
      expect(secondLogin.status()).toBe(200);
      const { data: secondSession } = await secondLogin.json();
      const secondHeaders = { Authorization: 'Bearer ' + secondSession.accessToken };

      const secondSessions = await secondClient.get(apiOrigin + '/api/auth/sessions', { headers: secondHeaders });
      expect(secondSessions.status()).toBe(200);
      const { data: secondActiveSessions } = await secondSessions.json();
      const currentSecondSession = secondActiveSessions.find((session) => session.current);
      expect(currentSecondSession?.id).toMatch(/^[0-9a-f-]{36}$/);

      const revoke = await mutate('sessions/' + currentSecondSession.id, {}, data.accessToken, client, 'DELETE');
      expect(revoke.status()).toBe(204);
      expect((await mutate('refresh', {}, undefined, secondClient)).status()).toBe(401);

      const remaining = await client.get(apiOrigin + '/api/auth/sessions', { headers });
      expect(remaining.status()).toBe(200);
      const { data: remainingSessions } = await remaining.json();
      expect(remainingSessions.some((session) => session.id === currentSecondSession.id)).toBe(false);
      expect(remainingSessions.filter((session) => session.current)).toHaveLength(1);
      expect((await client.get(apiOrigin + '/api/auth/me', { headers })).status()).toBe(200);
    } finally {
      await secondClient.dispose();
    }

    const rotatingClient = await playwright.request.newContext();

    try {
      const rotatingLogin = await mutate('login', { email, password: newPassword }, undefined, rotatingClient);
      expect(rotatingLogin.status()).toBe(200);

      const beforeRotation = await rotatingClient.storageState();
      const previousRefresh = beforeRotation.cookies.find((cookie) => cookie.name === 'bomTratoRefresh');
      expect(previousRefresh?.value).toMatch(/^[A-Za-z0-9_-]{43}$/);

      const replayClient = await playwright.request.newContext({ storageState: beforeRotation });

      try {
        const rotated = await mutate('refresh', {}, undefined, rotatingClient);
        expect(rotated.status()).toBe(200);

        const afterRotation = await rotatingClient.storageState();
        const nextRefresh = afterRotation.cookies.find((cookie) => cookie.name === 'bomTratoRefresh');
        expect(nextRefresh?.value).toMatch(/^[A-Za-z0-9_-]{43}$/);
        expect(nextRefresh.value).not.toBe(previousRefresh.value);

        expect((await mutate('refresh', {}, undefined, replayClient)).status()).toBe(401);
        expect((await mutate('refresh', {}, undefined, rotatingClient)).status()).toBe(401);
        expect((await client.get(apiOrigin + '/api/auth/me', { headers })).status()).toBe(200);
      } finally {
        await replayClient.dispose();
      }
    } finally {
      await rotatingClient.dispose();
    }

    expect((await mutate('logout-all', {}, data.accessToken)).status()).toBe(204);
    expect((await mutate('refresh')).status()).toBe(401);
    expect((await client.get(apiOrigin + '/api/auth/me')).status()).toBe(401);
  });
});
