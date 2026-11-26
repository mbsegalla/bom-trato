import { test, expect, success } from '../../support/api.fixture.mjs';
import { installAuthenticatedApp, organization } from '../../support/authenticatedApp.fixture.mjs';
import { installReceivableDetails, unpaidReceivable, receivableRoute } from '../../support/operationalDetails.fixture.mjs';
import { receivableId } from '../../support/operationalRecords.fixture.mjs';
import { fixtureCode, issuanceId, livePix, liveRoute, pendingFields, reviewFields, sandboxRoute } from '../../support/providerPix.fixture.mjs';

function panel(page) {
  return page.getByRole('main').locator('section').filter({
    has: page.getByRole('heading', { name: 'Pix real — Mercado Pago', exact: true }),
  });
}

async function fillBuyer(section) {
  await section.getByLabel('E-mail do pagador', { exact: true }).fill('fixture@example.invalid');
  await section.getByLabel('Documento do pagador (somente números)', { exact: true }).fill('00000000000');
}

test('requires explicit consent and issues only one scoped Pix request using the current receivable version', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  let current = livePix();
  installReceivableDetails(api, () => unpaidReceivable());
  api.respond('GET', liveRoute, () => success(current));
  api.respond('POST', liveRoute, () => {
    current = livePix(pendingFields());

    return success(current);
  });

  await page.goto('/receivables/' + receivableId);

  const section = panel(page);
  const issue = section.getByRole('button', { name: 'Gerar Pix real', exact: true });

  await expect(section.getByText('Produção', { exact: true })).toBeVisible();
  await fillBuyer(section);
  await expect(issue).toBeDisabled();
  await section.getByRole('checkbox', { name: /Confirmo a emissão de uma cobrança real/ }).check();
  await issue.click();

  await expect(section.getByText('Aguardando pagamento', { exact: true })).toBeVisible();
  await expect(section.getByRole('img', { name: 'QR Code Pix para pagamento' })).toBeVisible();
  await expect(section.getByLabel('Pix Copia e Cola', { exact: true })).toHaveValue(fixtureCode);
  await expect(issue).toHaveCount(0);
  await expect(page.getByText('Nenhum pagamento registrado.', { exact: true })).toBeVisible();

  const writes = api.calls.filter((call) => call.path === liveRoute && call.method === 'POST');

  expect(writes).toHaveLength(1);
  expect(writes[0].body).toEqual({
    version: 1, buyerEmail: 'fixture@example.invalid', buyerDocumentType: 'CPF',
    buyerDocumentNumber: '00000000000', confirmed: true,
  });
  expect(writes[0].headers['x-csrf-token']).toBe('fixture-csrf');
  expect(api.calls.filter((call) => call.path === receivableRoute + '/payments' && call.method === 'POST')).toHaveLength(0);
});

test('refreshes an uncertain issuance and recovers by immutable reference without generating a second Pix', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  let current = livePix();
  installReceivableDetails(api, () => unpaidReceivable());
  api.respond('GET', liveRoute, () => success(current));
  api.respond('POST', liveRoute, () => {
    current = livePix(reviewFields({ canRecover: true, reviewCode: 'UNCERTAIN_CREATION' }));

    return { status: 503, json: { success: false } };
  });
  api.respond('POST', liveRoute + '/recovery', () => {
    current = livePix(reviewFields({
      canRecover: false, lastRecoveryCode: 'NOT_FOUND',
      nextRecoveryAt: new Date(Date.now() + 60000).toISOString(),
    }));

    return success(current);
  });

  await page.goto('/receivables/' + receivableId);

  const section = panel(page);

  await fillBuyer(section);
  await section.getByRole('checkbox', { name: /Confirmo a emissão de uma cobrança real/ }).check();
  await section.getByRole('button', { name: 'Gerar Pix real', exact: true }).click();
  await expect(section.getByText('Revisão necessária', { exact: true })).toBeVisible();
  await expect(section.getByRole('alert').filter({ hasText: /não gere outra cobrança/ })).toBeVisible();
  await expect(section.getByRole('button', { name: 'Gerar Pix real', exact: true })).toHaveCount(0);

  await section.getByRole('button', { name: 'Consultar no Mercado Pago', exact: true }).click();
  await expect(section.getByText('Pagamento não localizado pela referência', { exact: true })).toBeVisible();
  await expect(section.getByText(/A ausência de resultados não comprova que o Pix não existe/)).toBeVisible();
  await expect(section.getByRole('button', { name: 'Consultar no Mercado Pago', exact: true })).toBeDisabled();

  const writes = api.calls.filter((call) => call.path.startsWith(liveRoute) && call.method === 'POST');

  expect(writes.map((call) => call.path)).toEqual([liveRoute, liveRoute + '/recovery']);
  expect(writes[1].body).toEqual({ issuanceId });
});

test('hides stale and amount-mismatched codes until an authoritative matching state is loaded', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  let current = livePix(pendingFields({ amountInCents: 100 }));
  installReceivableDetails(api, () => unpaidReceivable());
  api.respond('GET', liveRoute, () => success(current));

  await page.goto('/receivables/' + receivableId);

  const section = panel(page);
  const qr = section.getByRole('img', { name: 'QR Code Pix para pagamento' });

  await expect(section.getByText('Aguardando pagamento', { exact: true })).toBeVisible();
  await expect(qr).toHaveCount(0);
  await expect(section.getByRole('button', { name: 'Copiar código Pix', exact: true })).toHaveCount(0);

  current = livePix(pendingFields({ receivableVersion: 2 }));
  await section.getByRole('button', { name: 'Atualizar status', exact: true }).click();
  await expect(section.getByRole('button', { name: 'Atualizar recebível', exact: true })).toBeVisible();
  await expect(qr).toHaveCount(0);

  current = livePix(pendingFields());
  await section.getByRole('button', { name: 'Atualizar status', exact: true }).click();
  await expect(qr).toBeVisible();
  expect(api.calls.filter((call) => call.path === liveRoute && call.method === 'POST')).toHaveLength(0);
});

test('rechecks the provider state before copying and never copies a settled code', async ({ page, api }) => {
  await page.addInitScript(() => {
    window.fixtureClipboard = [];
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (text) => { window.fixtureClipboard.push(text); } },
    });
  });
  await installAuthenticatedApp(page, api);
  let current = livePix(pendingFields());
  installReceivableDetails(api, () => unpaidReceivable());
  api.respond('GET', liveRoute, () => success(current));

  await page.goto('/receivables/' + receivableId);

  const section = panel(page);
  const copy = section.getByRole('button', { name: 'Copiar código Pix', exact: true });

  await expect(copy).toBeVisible();
  current = livePix(reviewFields({ status: 'SETTLED', paymentId: '123456' }));
  await copy.click();

  await expect(section.getByText('Pagamento conciliado', { exact: true })).toBeVisible();
  await expect(copy).toHaveCount(0);
  expect(await page.evaluate(() => window.fixtureClipboard)).toEqual([]);
  expect(api.calls.filter((call) => call.path === liveRoute && call.method === 'POST')).toHaveLength(0);
});

test('does not request owner-only integrated Pix data for ordinary members', async ({ page, api }) => {
  await installAuthenticatedApp(page, api, { organizations: [{ ...organization, role: 'MEMBER' }] });
  installReceivableDetails(api, () => unpaidReceivable());

  await page.goto('/receivables/' + receivableId);

  await expect(page.getByText('Nenhum pagamento registrado.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pix real — Mercado Pago', exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Pix integrado — Mercado Pago', exact: true })).toHaveCount(0);
  expect(api.calls.filter((call) => call.path.startsWith(liveRoute) || call.path.startsWith(sandboxRoute))).toHaveLength(0);
});
