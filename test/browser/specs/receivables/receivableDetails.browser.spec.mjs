import { expect, success, test } from '../../support/api.fixture.mjs';
import { date, installAuthenticatedApp, organization, userId } from '../../support/authenticatedApp.fixture.mjs';
import {
  installReceivableDetails,
  payment,
  paymentId,
  receivableRoute,
  unpaidReceivable,
} from '../../support/operationalDetails.fixture.mjs';
import { receivableId } from '../../support/operationalRecords.fixture.mjs';

test('validates the outstanding balance, records a partial payment and reverses it with preserved history', async ({
  page,
  api,
}) => {
  await installAuthenticatedApp(page, api);
  let current = unpaidReceivable();
  let payments = [];

  installReceivableDetails(
    api,
    () => current,
    () => payments,
  );
  api.respond('POST', receivableRoute + '/payments', ({ body }) => {
    const saved = payment({
      requestId: body.requestId,
      receivedAt: body.receivedAt,
      notes: body.notes,
      amountInCents: body.amountInCents,
    });
    payments = [saved];
    current = { ...current, receivedInCents: 3000, balanceInCents: 9550, status: 'PARTIALLY_PAID', version: 2 };

    return success({ receivable: current, payment: saved });
  });
  api.respond('POST', receivableRoute + '/payments/' + paymentId + '/reverse', ({ body }) => {
    const reversed = { ...payments[0], reversedAt: date, reversedById: userId, reversalReason: body.reason };
    payments = [reversed];
    current = { ...current, receivedInCents: 0, balanceInCents: 12550, status: 'OPEN', version: 3 };

    return success({ receivable: current, payment: reversed });
  });

  await page.goto('/receivables/' + receivableId);

  const main = page.getByRole('main');

  await expect(main.getByText('Nenhum pagamento registrado.', { exact: true })).toBeVisible();
  await main.getByRole('button', { name: 'Registrar pagamento', exact: true }).click();

  const form = main.locator('form').filter({ has: page.locator('#payment-amount') });
  const submit = form.getByRole('button', { name: 'Registrar pagamento', exact: true });

  await form.getByLabel('Valor recebido *', { exact: true }).fill('999,99');
  await submit.click();
  await expect(form.getByText('O pagamento não pode ser maior que o saldo restante.', { exact: true })).toBeVisible();
  expect(
    api.calls.filter((call) => call.path === receivableRoute + '/payments' && call.method === 'POST'),
  ).toHaveLength(0);

  await form.getByLabel('Valor recebido *', { exact: true }).fill('30,00');
  await form.getByLabel('Observações', { exact: true }).fill('  Fixture receipt  ');
  await submit.click();

  await expect(form).toBeHidden();
  await expect(main.getByText('Parcialmente pago', { exact: true })).toBeVisible();
  await expect(main.getByText(/R\$\s*95,50/)).toBeVisible();
  await expect(main.getByText('Fixture receipt', { exact: true })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Cancelar recebível', exact: true })).toHaveCount(0);

  await main.getByRole('button', { name: 'Estornar', exact: true }).click();

  const reversal = main.locator('form').filter({ has: page.locator('#reversal-reason') });

  await reversal.getByRole('button', { name: 'Estornar pagamento', exact: true }).click();
  await expect(reversal.getByText('Informe um motivo com pelo menos 3 caracteres.', { exact: true })).toBeVisible();
  await reversal.getByLabel('Motivo *', { exact: true }).fill('  Fixture reversal  ');
  await reversal.getByRole('button', { name: 'Estornar pagamento', exact: true }).click();

  await expect(reversal).toBeHidden();
  await expect(main.getByText('Estornado', { exact: true })).toBeVisible();
  await expect(main.getByText('Motivo do estorno: Fixture reversal', { exact: true })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Estornar', exact: true })).toHaveCount(0);
  await expect(main.getByRole('button', { name: 'Cancelar recebível', exact: true })).toBeVisible();

  const recorded = api.calls.filter((call) => call.path === receivableRoute + '/payments' && call.method === 'POST');
  const reversed = api.calls.filter((call) => call.path === receivableRoute + '/payments/' + paymentId + '/reverse');

  expect(recorded).toHaveLength(1);
  expect(recorded[0].body).toMatchObject({ version: 1, amountInCents: 3000, method: 'PIX', notes: 'Fixture receipt' });
  expect(recorded[0].body.requestId).toMatch(/^[0-9a-f-]{36}$/);
  expect(reversed).toHaveLength(1);
  expect(reversed[0].body).toEqual({ version: 2, reason: 'Fixture reversal' });
});

test('preserves a payment idempotency key on unchanged retries and renews it after editing the amount', async ({
  page,
  api,
}) => {
  await installAuthenticatedApp(page, api);
  const current = unpaidReceivable();

  installReceivableDetails(api, () => current);
  api.respond('POST', receivableRoute + '/payments', () => ({ status: 503, json: { success: false } }));

  await page.goto('/receivables/' + receivableId);

  const main = page.getByRole('main');

  await main.getByRole('button', { name: 'Registrar pagamento', exact: true }).click();

  const form = main.locator('form').filter({ has: page.locator('#payment-amount') });
  const submit = form.getByRole('button', { name: 'Registrar pagamento', exact: true });
  const error = form.getByText('Os recebíveis estão sendo atualizados. Tente novamente em instantes.', { exact: true });
  const writes = () =>
    api.calls.filter((call) => call.path === receivableRoute + '/payments' && call.method === 'POST');

  await submit.click();
  await expect(error).toBeVisible();
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect.poll(() => writes().length).toBe(2);
  await expect(error).toBeVisible();
  await expect(submit).toBeEnabled();

  expect(writes()[1].body).toEqual(writes()[0].body);

  await form.getByLabel('Valor recebido *', { exact: true }).fill('50,00');
  await submit.click();
  await expect.poll(() => writes().length).toBe(3);
  await expect(error).toBeVisible();

  expect(writes()[2].body.amountInCents).toBe(5000);
  expect(writes()[2].body.requestId).not.toBe(writes()[1].body.requestId);
  await expect(main.getByText('Nenhum pagamento registrado.', { exact: true })).toBeVisible();
});

test('saves edits with the current version and cancels an unpaid receivable using the next version', async ({
  page,
  api,
}) => {
  await installAuthenticatedApp(page, api);
  let current = unpaidReceivable();

  installReceivableDetails(api, () => current);
  api.respond('PATCH', receivableRoute, ({ body }) => {
    current = { ...current, ...body, version: 2 };

    return success(current);
  });
  api.respond('POST', receivableRoute + '/cancel', ({ body }) => {
    current = {
      ...current,
      status: 'CANCELED',
      version: 3,
      balanceInCents: 0,
      canceledAt: date,
      canceledById: userId,
      cancellationReason: body.reason,
    };

    return success(current);
  });

  await page.goto('/receivables/' + receivableId);

  const main = page.getByRole('main');

  await main.getByRole('button', { name: 'Editar', exact: true }).click();
  const edit = main.locator('form').filter({ has: page.locator('#receivable-notes') });

  await edit.getByLabel('Observações', { exact: true }).fill('  Updated fixture note  ');
  await edit.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await expect(edit).toBeHidden();
  await expect(main.getByText('Updated fixture note', { exact: true })).toBeVisible();

  await main.getByRole('button', { name: 'Cancelar recebível', exact: true }).click();

  const cancel = main.locator('form').filter({ has: page.locator('#receivable-cancel-reason') });

  await cancel.getByLabel('Motivo *', { exact: true }).fill('  Fixture cancellation  ');
  await cancel.getByRole('button', { name: 'Cancelar recebível', exact: true }).click();

  await expect(cancel).toBeHidden();
  await expect(main.getByRole('heading', { name: 'Motivo do cancelamento', exact: true })).toBeVisible();
  await expect(main.getByText('Fixture cancellation', { exact: true })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Registrar pagamento', exact: true })).toHaveCount(0);
  await expect(main.getByRole('button', { name: 'Editar', exact: true })).toHaveCount(0);

  const edits = api.calls.filter((call) => call.path === receivableRoute && call.method === 'PATCH');
  const cancels = api.calls.filter((call) => call.path === receivableRoute + '/cancel');

  expect(edits).toHaveLength(1);
  expect(edits[0].body).toMatchObject({ version: 1, notes: 'Updated fixture note' });
  expect(cancels).toHaveLength(1);
  expect(cancels[0].body).toEqual({ version: 2, reason: 'Fixture cancellation' });
});

test('does not request owner-only Pix or payment-link data when operating as a member', async ({ page, api }) => {
  await installAuthenticatedApp(page, api, { organizations: [{ ...organization, role: 'MEMBER' }] });
  const current = unpaidReceivable();

  installReceivableDetails(api, () => current);

  await page.goto('/receivables/' + receivableId);

  const main = page.getByRole('main');

  await expect(main.getByText('Nenhum pagamento registrado.', { exact: true })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Registrar pagamento', exact: true })).toBeVisible();
  await expect(main.getByRole('heading', { name: 'Cobrança Pix', exact: true })).toHaveCount(0);
  await expect(main.getByRole('heading', { name: 'Link de pagamento', exact: true })).toHaveCount(0);
  expect(api.calls.filter((call) => call.path.startsWith(receivableRoute + '/mercado-pago/'))).toHaveLength(0);
  expect(api.calls.filter((call) => call.path === receivableRoute + '/payment-link')).toHaveLength(0);
});
