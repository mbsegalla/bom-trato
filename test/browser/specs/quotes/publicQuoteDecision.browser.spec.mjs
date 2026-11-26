import { expect, success, test } from '../../support/api.fixture.mjs';

const token = 'a'.repeat(64);
const route = '/api/public/quotes';
const date = '2026-01-01T00:00:00.000Z';
const quote = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Fixture quote',
  customerName: 'Fixture customer',
  status: 'SENT',
  version: 3,
  currency: 'brl',
  subtotalInCents: 10000,
  discountInCents: 1000,
  totalInCents: 9000,
  paymentCondition: 'AFTER_COMPLETION',
  downPaymentPercentage: null,
  notes: null,
  validUntil: null,
  organizationName: 'Fixture business',
  sharedVersion: 3,
  canDecide: true,
  canRequestChange: true,
  changeRequestedAt: null,
  items: [],
  expiresAt: '2030-01-01T00:00:00.000Z',
};

test('approves a shared quote once and removes the decision controls after confirmation', async ({ page, api }) => {
  api.respond('POST', route + '/resolve', () => success(quote));
  api.respond('POST', route + '/approve', () => success({ status: 'APPROVED', decidedAt: date, version: 4 }));

  await page.goto('/quote-share#token=' + token);

  await page.getByRole('button', { name: 'Aprovar orçamento' }).click();
  await expect(page.getByRole('button', { name: 'Aprovar orçamento' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Recusar orçamento' })).toHaveCount(0);

  const decisions = api.calls.filter((call) => call.path === route + '/approve');

  expect(decisions).toHaveLength(1);
  expect(decisions[0].body).toEqual({ token, version: 3 });
  expect(decisions[0].headers.authorization).toBeUndefined();
});

test('validates a change request locally and sends only the trimmed message and shared version', async ({
  page,
  api,
}) => {
  api.respond('POST', route + '/resolve', () => success(quote));
  api.respond('POST', route + '/change-request', () => success({ requestedAt: date }));

  await page.goto('/quote-share#token=' + token);

  await page.getByRole('button', { name: 'Solicitar alteração' }).click();
  await page.getByRole('button', { name: 'Enviar solicitação' }).click();

  await expect(
    page.getByRole('alert').filter({ hasText: 'Explique brevemente o que gostaria de alterar.' }),
  ).toBeVisible();
  expect(api.calls.filter((call) => call.path === route + '/change-request')).toHaveLength(0);

  await page
    .getByPlaceholder('Ex.: Gostaria de retirar o segundo item do orçamento.')
    .fill('  Alterar prazo de entrega  ');
  await page.getByRole('button', { name: 'Enviar solicitação' }).click();

  await expect(page.getByText('Alteração solicitada', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Aprovar orçamento' })).toHaveCount(0);

  const changes = api.calls.filter((call) => call.path === route + '/change-request');

  expect(changes).toHaveLength(1);
  expect(changes[0].body).toEqual({ token, version: 3, message: 'Alterar prazo de entrega' });
});

test('reports a stale decision without silently retrying the request', async ({ page, api }) => {
  api.respond('POST', route + '/resolve', () => success(quote));
  api.respond('POST', route + '/decline', () => ({ status: 409, json: { success: false } }));

  await page.goto('/quote-share#token=' + token);

  await page.getByRole('button', { name: 'Recusar orçamento' }).click();

  await expect(page.getByText('Este orçamento já foi alterado ou decidido.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Recusar orçamento' })).toBeEnabled();
  expect(api.calls.filter((call) => call.path === route + '/decline')).toHaveLength(1);
});
