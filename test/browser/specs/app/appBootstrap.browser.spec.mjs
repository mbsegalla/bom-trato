import { test, expect, success } from '../../support/api.fixture.mjs';
import {
  installAuthenticatedApp,
  onboarding,
  organization,
  organizationId,
  organizationRoute,
  otherOrganizationId,
} from '../../support/authenticatedApp.fixture.mjs';

test('restores an authenticated session and scopes the application to the joined organization', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  await page.goto('/customers');

  await expect(page.getByRole('heading', { name: 'Clientes', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ainda não há clientes por aqui' })).toBeVisible();

  expect(await page.evaluate(() => localStorage.getItem('bom-trato:active-organization'))).toBe(organizationId);

  const customerRequests = api.calls.filter((call) => call.path === organizationRoute(organizationId, 'customers'));

  expect(customerRequests).toHaveLength(1);
  expect(customerRequests[0].headers.authorization).toBe('Bearer fixture-access');
  expect(customerRequests[0].query).toMatchObject({ page: '1', status: 'ACTIVE' });
  expect(api.calls.filter((call) => call.path === '/api/auth/refresh')).toHaveLength(1);
});

test('skips a stored organization that cannot access the app and loads only the available tenant', async ({ page, api }) => {
  const other = { ...organization, id: otherOrganizationId, name: 'Available business' };

  await page.addInitScript((id) => localStorage.setItem('bom-trato:active-organization', id), organizationId);
  await installAuthenticatedApp(page, api, {
    organizations: [organization, other],
    onboarding: (id) => id === organizationId
      ? onboarding(id, { step: 'SELECT_PLAN', accessSource: 'NONE' })
      : onboarding(id),
  });

  await page.goto('/customers');

  await expect(page.getByRole('heading', { name: 'Ainda não há clientes por aqui' })).toBeVisible();

  expect(api.calls.filter((call) => call.path === '/api/onboarding').map((call) => call.query.organizationId))
    .toEqual([organizationId, otherOrganizationId]);
  expect(api.calls.filter((call) => call.path === organizationRoute(organizationId, 'customers'))).toHaveLength(0);
  expect(api.calls.filter((call) => call.path === organizationRoute(otherOrganizationId, 'customers'))).toHaveLength(1);
  expect(await page.evaluate(() => localStorage.getItem('bom-trato:active-organization'))).toBe(otherOrganizationId);
});

test('redirects to login when session restoration is denied before any private data is loaded', async ({ page, api }) => {
  api.respond('GET', '/api/auth/csrf', () => success({ csrfToken: 'fixture-csrf' }));
  api.respond('POST', '/api/auth/refresh', () => ({ status: 401, json: { success: false } }));

  await page.goto('/customers');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel('Senha', { exact: true })).toBeVisible();
  expect(api.calls.filter((call) => call.path.startsWith('/api/organizations'))).toHaveLength(0);
});
