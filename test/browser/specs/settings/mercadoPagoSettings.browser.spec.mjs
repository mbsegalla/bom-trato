import { expect, success, test } from '../../support/api.fixture.mjs';
import { installAuthenticatedApp } from '../../support/authenticatedApp.fixture.mjs';
import {
  configuredPix,
  connectedAccount,
  connection,
  connectionRoute,
  installReceiving,
  settingsRoute,
} from '../../support/receiving.fixture.mjs';

function panel(page) {
  return page
    .getByRole('main')
    .locator('section')
    .filter({
      has: page.getByRole('heading', { name: 'Mercado Pago', exact: true }),
    });
}

test('requires confirmation before disconnecting and does not alter manual Pix configuration', async ({
  page,
  api,
}) => {
  await installAuthenticatedApp(page, api);
  let current = connectedAccount();

  installReceiving(
    api,
    () => configuredPix(),
    () => current,
  );
  api.respond('DELETE', connectionRoute, () => {
    current = connection({ status: 'DISCONNECTED' });

    return success(null);
  });

  await page.goto('/settings?tab=receiving');

  const section = panel(page);

  await expect(section.getByText('Conta vinculada', { exact: true })).toBeVisible();
  await expect(section.getByText('Ambiente: Testes', { exact: true })).toBeVisible();
  await expect(section.getByText('Conta: 123456789', { exact: true })).toBeVisible();
  await section.getByRole('button', { name: 'Desconectar', exact: true }).click();
  await expect(section.getByRole('button', { name: 'Confirmar desconexão' })).toBeVisible();

  await section.getByRole('button', { name: 'Cancelar', exact: true }).click();
  expect(api.calls.filter((call) => call.method === 'DELETE')).toHaveLength(0);
  await section.getByRole('button', { name: 'Desconectar', exact: true }).click();
  await section.getByRole('button', { name: 'Confirmar desconexão' }).click();

  await expect(section.getByText('Desconectado', { exact: true })).toBeVisible();
  await expect(section.getByRole('button', { name: 'Reconectar Mercado Pago' })).toBeVisible();
  await expect(section.getByRole('button', { name: 'Desconectar', exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Chave Pix', { exact: true })).toHaveValue('fixture@example.invalid');

  expect(api.calls.filter((call) => call.path === connectionRoute && call.method === 'DELETE')).toHaveLength(1);
  expect(api.calls.filter((call) => call.path === settingsRoute && call.method !== 'GET')).toHaveLength(0);
});

test('rejects an untrusted authorization URL without navigating away or creating another request', async ({
  page,
  api,
}) => {
  await installAuthenticatedApp(page, api);
  installReceiving(api);
  api.respond('POST', connectionRoute + '/start', () =>
    success({
      authorizationUrl: 'https://fixture.example.invalid/authorization',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    }),
  );

  await page.goto('/settings?tab=receiving');

  const section = panel(page);

  await section.getByRole('button', { name: 'Conectar Mercado Pago', exact: true }).click();
  await expect(section.getByRole('alert')).toHaveText(
    'Não foi possível confirmar o endereço de autorização do Mercado Pago.',
  );
  await expect(page).toHaveURL(/\/settings\?tab=receiving$/);
  await expect(section.getByRole('button', { name: 'Conectar Mercado Pago', exact: true })).toBeEnabled();
  expect(api.calls.filter((call) => call.path === connectionRoute + '/start')).toHaveLength(1);
});

test('shows the disabled-provider state and does not offer connect or disconnect operations', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  installReceiving(
    api,
    () => configuredPix(),
    () => connection({ available: false, canConnect: false }),
  );

  await page.goto('/settings?tab=receiving');

  const section = panel(page);

  await expect(
    section.getByText('A conexão ainda não está habilitada pelo administrador da plataforma.', { exact: true }),
  ).toBeVisible();
  await expect(section.getByRole('button', { name: 'Conectar Mercado Pago', exact: true })).toHaveCount(0);
  await expect(section.getByRole('button', { name: 'Desconectar', exact: true })).toHaveCount(0);
  expect(api.calls.filter((call) => call.path.startsWith(connectionRoute) && call.method !== 'GET')).toHaveLength(0);
});
