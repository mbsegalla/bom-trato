import { test, expect, success } from '../../support/api.fixture.mjs';
import { installAuthenticatedApp } from '../../support/authenticatedApp.fixture.mjs';
import { installReceivableDetails, unpaidReceivable, receivableRoute } from '../../support/operationalDetails.fixture.mjs';
import { receivableId } from '../../support/operationalRecords.fixture.mjs';
import { fixtureCode, issuanceId, liveRoute, notFoundAttempt, pendingFields, reviewFields, sandboxPix, sandboxReview, sandboxRoute } from '../../support/providerPix.fixture.mjs';

function panel(page) {
  return page.getByRole('main').locator('section').filter({
    has: page.getByRole('heading', { name: 'Pix integrado — Mercado Pago', exact: true }),
  });
}

test('issues a labeled sandbox QR with test-only buyer fields and never changes the real financial ledger', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  let current = sandboxPix();

  installReceivableDetails(api, () => unpaidReceivable());
  api.respond('GET', sandboxRoute, () => success(current));
  api.respond('POST', sandboxRoute, () => {
    current = sandboxPix(pendingFields());

    return success(current);
  });
  api.respond('GET', sandboxRoute + '/recovery', () => success(sandboxReview()));

  await page.goto('/receivables/' + receivableId);

  const section = panel(page);
  const issue = section.getByRole('button', { name: 'Gerar Pix de teste', exact: true });

  await expect(section.getByText('Ambiente de testes', { exact: true })).toBeVisible();
  await section.getByLabel('E-mail do comprador de teste', { exact: true }).fill('fixture@example.invalid');
  await section.getByLabel('Documento de teste (somente números)', { exact: true }).fill('00000000000');
  await expect(issue).toBeDisabled();
  await section.getByRole('checkbox', { name: /Confirmo que esta é uma emissão de teste/ }).check();
  await issue.click();

  await expect(section.getByRole('img', { name: 'QR Code Pix de teste — não utilizar para pagamentos reais' })).toBeVisible();
  await expect(section.getByLabel('Pix Copia e Cola — somente teste', { exact: true })).toHaveValue(fixtureCode);
  await expect(section.getByText(/O saldo real não é alterado/)).toBeVisible();
  await expect(page.getByText('Nenhum pagamento registrado.', { exact: true })).toBeVisible();

  expect(api.calls.filter((call) => call.path === sandboxRoute && call.method === 'POST').map((call) => call.body)).toEqual([{
    version: 1, testBuyerEmail: 'fixture@example.invalid', testDocumentType: 'CPF',
    testDocumentNumber: '00000000000', confirmed: true,
  }]);
  expect(api.calls.filter((call) => call.method === 'POST' && (call.path === liveRoute || call.path === receivableRoute + '/payments'))).toHaveLength(0);
});

test('keeps an unresolved sandbox issuance blocked after a provider lookup finds no payment', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  let review = sandboxReview();

  installReceivableDetails(api, () => unpaidReceivable());
  api.respond('GET', sandboxRoute, () => success(sandboxPix(reviewFields())));
  api.respond('GET', sandboxRoute + '/recovery', () => success(review));
  api.respond('POST', sandboxRoute + '/recovery', () => {
    review = sandboxReview({
      canRecover: false,
      nextRecoveryAt: new Date(Date.now() + 60000).toISOString(),
      lastAttempt: notFoundAttempt(),
    });

    return success(review);
  });

  await page.goto('/receivables/' + receivableId);

  const section = panel(page);

  await expect(section.getByText('Revisão necessária', { exact: true })).toBeVisible();
  await section.getByRole('button', { name: 'Consultar no Mercado Pago', exact: true }).click();
  await expect(section.getByText('Nenhum pagamento localizado pela referência', { exact: true })).toBeVisible();
  await expect(section.getByText(/A referência permanece bloqueada/)).toBeVisible();
  await expect(section.getByRole('button', { name: 'Consultar no Mercado Pago', exact: true })).toBeDisabled();
  await expect(section.getByRole('button', { name: 'Gerar Pix de teste', exact: true })).toHaveCount(0);

  expect(api.calls.filter((call) => call.path === sandboxRoute + '/recovery' && call.method === 'POST').map((call) => call.body))
    .toEqual([{ issuanceId }]);
  expect(api.calls.filter((call) => call.path === sandboxRoute && call.method === 'POST')).toHaveLength(0);
});
