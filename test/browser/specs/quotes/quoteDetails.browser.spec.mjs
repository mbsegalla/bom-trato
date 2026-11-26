import { expect, success, test } from '../../support/api.fixture.mjs';
import { date, installAuthenticatedApp } from '../../support/authenticatedApp.fixture.mjs';
import { installQuoteDetails, quoteDetails, quoteRoute } from '../../support/operationalDetails.fixture.mjs';
import { quoteId } from '../../support/operationalRecords.fixture.mjs';

test('validates discounts, saves a versioned draft and displays the exact deposit and balance', async ({
  page,
  api,
}) => {
  await installAuthenticatedApp(page, api);
  let current = quoteDetails();

  installQuoteDetails(api, () => current);
  api.respond('PATCH', quoteRoute, ({ body }) => {
    current = { ...current, ...body, version: 2, totalInCents: current.subtotalInCents - body.discountInCents };

    return success(current);
  });

  await page.goto('/quotes/' + quoteId);

  const main = page.getByRole('main');

  await expect(main.getByRole('heading', { name: 'Fixture quote', exact: true })).toBeVisible();
  await main.getByRole('button', { name: 'Editar', exact: true }).click();

  const form = main.locator('form').filter({ has: page.locator('#edit-quote-title') });
  const discount = form.getByLabel('Desconto', { exact: true });
  const submit = form.getByRole('button', { name: 'Salvar alterações', exact: true });

  await discount.fill('999,99');
  await submit.click();
  await expect(form.getByText('O desconto não pode ser maior que o subtotal.', { exact: true })).toBeVisible();
  expect(api.calls.filter((call) => call.method === 'PATCH' && call.path === quoteRoute)).toHaveLength(0);

  await form.getByLabel('Título *', { exact: true }).fill('  Updated quote  ');
  await discount.fill('5,50');
  await form.getByLabel('Condição de pagamento').selectOption('DOWN_PAYMENT_AND_BALANCE');
  await form.getByLabel('Entrada', { exact: true }).fill('25');
  await submit.click();

  await expect(form).toBeHidden();
  await expect(main.getByRole('heading', { name: 'Updated quote', exact: true })).toBeVisible();

  const summary = main
    .getByRole('complementary')
    .filter({ has: page.getByRole('heading', { name: 'Resumo', exact: true }) });

  await expect(summary.getByText('Entrada (25%)', { exact: true })).toBeVisible();
  await expect(summary.getByText(/R\$\s*30,00/)).toBeVisible();
  await expect(summary.getByText(/R\$\s*90,00/)).toBeVisible();

  const writes = api.calls.filter((call) => call.method === 'PATCH' && call.path === quoteRoute);

  expect(writes).toHaveLength(1);
  expect(writes[0].body).toEqual({
    title: 'Updated quote',
    notes: null,
    validUntil: null,
    discountInCents: 550,
    paymentCondition: 'DOWN_PAYMENT_AND_BALANCE',
    downPaymentPercentage: 25,
    version: 1,
  });
  expect(writes[0].headers['x-csrf-token']).toBe('fixture-csrf');
});

test('requires confirmation before approval and stops offering draft or decision actions after success', async ({
  page,
  api,
}) => {
  await installAuthenticatedApp(page, api);
  let current = quoteDetails({ status: 'SENT', sentAt: date });

  installQuoteDetails(api, () => current);
  api.respond('POST', quoteRoute + '/approve', () => {
    current = { ...current, status: 'APPROVED', decidedAt: date, version: 2 };

    return success(current);
  });

  await page.goto('/quotes/' + quoteId);

  const main = page.getByRole('main');
  const approve = main.getByRole('button', { name: 'Registrar aprovação', exact: true });

  await approve.click();

  const confirmation = main.getByRole('alertdialog', { name: 'Registrar aprovação?' });

  await confirmation.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(confirmation).toBeHidden();
  expect(api.calls.filter((call) => call.path === quoteRoute + '/approve')).toHaveLength(0);

  await approve.click();
  await confirmation.getByRole('button', { name: 'Registrar aprovação', exact: true }).click();

  await expect(confirmation).toBeHidden();
  await expect(main.getByRole('button', { name: 'Ver ordem de serviço', exact: true })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Registrar aprovação', exact: true })).toHaveCount(0);
  await expect(main.getByRole('button', { name: 'Registrar recusa', exact: true })).toHaveCount(0);
  await expect(main.getByText('Enviado → Aprovado', { exact: true })).toBeVisible();

  const writes = api.calls.filter((call) => call.path === quoteRoute + '/approve');

  expect(writes).toHaveLength(1);
  expect(writes[0].body).toEqual({ version: 1 });
});

test('does not permit approving or rejecting an expired proposal', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  const current = quoteDetails({ status: 'SENT', sentAt: date, validUntil: '2020-01-01T00:00:00Z' });

  installQuoteDetails(api, () => current);

  await page.goto('/quotes/' + quoteId);

  const main = page.getByRole('main');

  await expect(main.getByRole('heading', { name: 'Fixture quote', exact: true })).toBeVisible();
  await expect(main.getByText('Expirado', { exact: true })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Registrar aprovação', exact: true })).toHaveCount(0);
  await expect(main.getByRole('button', { name: 'Registrar recusa', exact: true })).toHaveCount(0);
  await expect(main.getByRole('button', { name: 'Editar', exact: true })).toHaveCount(0);
  expect(api.calls.filter((call) => call.method === 'POST' && call.path.startsWith(quoteRoute))).toHaveLength(0);
});
