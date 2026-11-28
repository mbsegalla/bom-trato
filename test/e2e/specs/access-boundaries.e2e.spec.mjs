import { randomUUID } from 'node:crypto';

import { apiOrigin, appOrigin, expect, expireAccount, inspectAccount, test } from '../support/fullStack.fixture.mjs';

const password = 'Fixture!Password123';

async function mutate(client, path, data) {
  const csrf = await client.get(apiOrigin + '/api/auth/csrf', { headers: { Origin: appOrigin } });
  expect(csrf.status()).toBe(200);
  const { data: csrfData } = await csrf.json();

  return client.post(apiOrigin + '/api/auth/' + path, {
    data,
    headers: { Origin: appOrigin, 'X-CSRF-Token': csrfData.csrfToken },
  });
}

async function register(client) {
  const email = 'e2e-' + randomUUID() + '@example.com';
  const response = await mutate(client, 'register', {
    email,
    password,
    name: 'E2E Boundary Owner',
    termsVersion: '1.0',
    privacyNoticeVersion: '1.0',
  });
  expect(response.status()).toBe(201);

  return email;
}

function actionToken(operation, email) {
  const { link } = inspectAccount(operation, email);
  const token = new URLSearchParams(new URL(link).hash.slice(1)).get('token');
  expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);

  return token;
}

async function createOwner(client, email) {
  const verified = await mutate(client, 'verify-email', { token: actionToken('verification-link', email) });
  expect(verified.status()).toBe(200);
  const { data: session } = await verified.json();
  const headers = { Authorization: 'Bearer ' + session.accessToken };
  const bootstrap = await client.post(apiOrigin + '/api/onboarding/bootstrap', { headers });
  expect(bootstrap.status()).toBe(200);
  const { data: initial } = await bootstrap.json();
  const organizationId = initial.organizationId;
  expect(organizationId).toMatch(/^[0-9a-f-]{36}$/);

  const completed = await client.post(apiOrigin + '/api/onboarding/business', {
    headers,
    data: { organizationId, name: 'E2E Boundary Business' },
  });
  expect(completed.status()).toBe(200);
  const { data } = await completed.json();
  expect(data).toMatchObject({ step: 'APP', accessSource: 'TRIAL', organizationId });

  return { headers, organizationId };
}

test('rejects expired email verification and password recovery tokens', async ({ playwright }) => {
  const client = await playwright.request.newContext();

  try {
    const unverifiedEmail = await register(client);
    const verificationToken = actionToken('verification-link', unverifiedEmail);
    expect(expireAccount('verification', unverifiedEmail)).toEqual({ expired: true });
    expect((await mutate(client, 'verify-email', { token: verificationToken })).status()).toBe(401);

    const email = await register(client);
    await createOwner(client, email);

    expect((await mutate(client, 'forgot-password', { email })).status()).toBe(202);
    const resetToken = actionToken('reset-link', email);
    expect(expireAccount('reset', email)).toEqual({ expired: true });
    expect(
      (await mutate(client, 'reset-password', { token: resetToken, password: 'Fixture!UpdatedPassword456' })).status(),
    ).toBe(401);
    expect((await mutate(client, 'login', { email, password })).status()).toBe(200);
  } finally {
    await client.dispose();
  }
});

test('isolates organization customers and blocks expired trial operations', async ({ playwright }) => {
  const first = await playwright.request.newContext();
  const second = await playwright.request.newContext();

  try {
    const firstEmail = await register(first);
    const owner = await createOwner(first, firstEmail);
    const secondEmail = await register(second);
    const outsider = await createOwner(second, secondEmail);
    expect(outsider.organizationId).not.toBe(owner.organizationId);

    const ownerPath = apiOrigin + '/api/organizations/' + owner.organizationId + '/customers';
    const outsiderPath = apiOrigin + '/api/organizations/' + outsider.organizationId + '/customers';
    const customer = { name: 'E2E Private Customer', phone: '34999999999' };

    const created = await first.post(ownerPath, { headers: owner.headers, data: customer });
    expect(created.status()).toBe(201);
    const { data: saved } = await created.json();
    expect(saved.id).toMatch(/^[0-9a-f-]{36}$/);

    const customerPath = ownerPath + '/' + saved.id;
    expect((await first.get(customerPath, { headers: owner.headers })).status()).toBe(200);
    expect((await second.get(ownerPath, { headers: outsider.headers })).status()).toBe(403);
    expect((await second.get(customerPath, { headers: outsider.headers })).status()).toBe(403);
    expect(
      (await second.patch(customerPath, { headers: outsider.headers, data: { ...customer, name: 'Unauthorized' } }))
        .status(),
    ).toBe(403);
    expect((await second.get(outsiderPath + '/' + saved.id, { headers: outsider.headers })).status()).toBe(404);

    const unchanged = await first.get(customerPath, { headers: owner.headers });
    expect(unchanged.status()).toBe(200);
    expect((await unchanged.json()).data.name).toBe(customer.name);

    expect(expireAccount('trial', firstEmail)).toEqual({ expired: true });
    const state = await first.get(apiOrigin + '/api/onboarding?organizationId=' + owner.organizationId, {
      headers: owner.headers,
    });
    expect(state.status()).toBe(200);
    const { data: expired } = await state.json();
    expect(expired).toMatchObject({
      organizationId: owner.organizationId,
      accessSource: 'NONE',
      trialEligible: false,
      trial: { active: false, remainingDays: 0 },
    });
    expect(expired.step).not.toBe('APP');
    expect((await first.get(customerPath, { headers: owner.headers })).status()).toBe(403);
    expect((await first.post(ownerPath, { headers: owner.headers, data: customer })).status()).toBe(403);
    expect(inspectAccount('account-state', firstEmail)).toMatchObject({
      organizationId: owner.organizationId,
      activeTrial: false,
      trialCount: 1,
      subscriptionCount: 0,
    });
    expect((await second.get(outsiderPath, { headers: outsider.headers })).status()).toBe(200);
  } finally {
    await first.dispose();
    await second.dispose();
  }
});
