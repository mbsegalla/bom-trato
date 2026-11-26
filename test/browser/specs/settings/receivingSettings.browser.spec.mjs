import { test, expect, success } from '../../support/api.fixture.mjs';
import { installAuthenticatedApp, organization } from '../../support/authenticatedApp.fixture.mjs';
import { configuredPix, connectionRoute, installReceiving, receivingSettings, settingsRoute } from '../../support/receiving.fixture.mjs';

function receivingSection(page) {
  return page.getByRole('main').locator('section').filter({
    has: page.getByRole('heading', { name: 'Dados de recebimento', exact: true }),
  });
}

test('requires explicit account confirmation and saves only normalized receiving settings', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  let current = receivingSettings();

  installReceiving(api, () => current);
  api.respond('PUT', settingsRoute, ({ body }) => {
    const { confirmed, ...fields } = body;

    current = receivingSettings({ ...fields, version: body.version + 1 });

    return success(current);
  });

  await page.goto('/settings?tab=receiving');

  const section = receivingSection(page);
  const enabled = section.getByRole('checkbox', { name: 'Cadastrar destino Pix' });
  const save = section.getByRole('button', { name: 'Salvar dados de recebimento' });
  const confirm = section.getByRole('checkbox', { name: /Confirmei no meu banco/ });

  await expect(section.getByText('Nenhum destino Pix cadastrado', { exact: true })).toBeVisible();
  await enabled.check();
  await section.locator('#receiving-pix-type').click();
  await page.getByRole('option', { name: 'E-mail', exact: true }).click();

  await section.getByLabel('Chave Pix', { exact: true }).fill('  fixture@example.invalid  ');
  await section.getByLabel('Nome exibido do recebedor', { exact: true }).fill('  Fixture business  ');
  await section.getByLabel('Cidade do recebedor', { exact: true }).fill('Uberlandia');
  await expect(save).toBeDisabled();

  await confirm.check();
  await expect(save).toBeEnabled();
  await section.getByLabel('Cidade do recebedor', { exact: true }).fill(' Uberlandia ');
  await expect(confirm).not.toBeChecked();
  await expect(save).toBeDisabled();
  await confirm.check();
  await save.click();

  await expect(section.getByText('Destino Pix cadastrado', { exact: true })).toBeVisible();
  await expect(section.getByLabel('Chave Pix', { exact: true })).toHaveValue('fixture@example.invalid');
  await expect(confirm).not.toBeChecked();

  const writes = api.calls.filter((call) => call.path === settingsRoute && call.method === 'PUT');

  expect(writes).toHaveLength(1);
  expect(writes[0].body).toEqual({
    pixEnabled: true, pixKeyType: 'EMAIL', pixKey: 'fixture@example.invalid',
    merchantName: 'Fixture business', merchantCity: 'Uberlandia', confirmed: true, version: 0,
  });
  expect(writes[0].headers['x-csrf-token']).toBe('fixture-csrf');
});

test('clears the previous key and confirmation when changing key type', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  installReceiving(api, () => configuredPix());

  await page.goto('/settings?tab=receiving');

  const section = receivingSection(page);
  const key = section.getByLabel('Chave Pix', { exact: true });
  const confirm = section.getByRole('checkbox', { name: /Confirmei no meu banco/ });

  await expect(key).toHaveValue('fixture@example.invalid');
  await confirm.check();
  await section.locator('#receiving-pix-type').click();
  await page.getByRole('option', { name: 'Chave aleatória', exact: true }).click();
  await expect(key).toHaveValue('');
  await expect(confirm).not.toBeChecked();
  await expect(section.getByRole('button', { name: 'Salvar dados de recebimento' })).toBeDisabled();
  expect(api.calls.filter((call) => call.path === settingsRoute && call.method === 'PUT')).toHaveLength(0);
});

test('removes every receiving field explicitly instead of retaining stale payment destination data', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  let current = configuredPix();

  installReceiving(api, () => current);
  api.respond('PUT', settingsRoute, ({ body }) => {
    current = receivingSettings({ version: body.version + 1 });

    return success(current);
  });

  await page.goto('/settings?tab=receiving');

  const section = receivingSection(page);

  await expect(section.getByLabel('Chave Pix', { exact: true })).toHaveValue('fixture@example.invalid');
  await section.getByRole('checkbox', { name: 'Cadastrar destino Pix' }).uncheck();
  await expect(section.getByText('Ao salvar, a chave e os dados do recebedor serão removidos da configuração.')).toBeVisible();
  await section.getByRole('button', { name: 'Remover dados Pix' }).click();

  await expect(section.getByText('Nenhum destino Pix cadastrado', { exact: true })).toBeVisible();
  await expect(section.getByLabel('Chave Pix', { exact: true })).toHaveCount(0);
  await expect(section.getByRole('button', { name: 'Remover dados Pix' })).toBeDisabled();

  expect(api.calls.filter((call) => call.path === settingsRoute && call.method === 'PUT').map((call) => call.body)).toEqual([{
    pixEnabled: false, pixKeyType: null, pixKey: null, merchantName: null, merchantCity: null, confirmed: false, version: 1,
  }]);
});

test('blocks stale writes until an explicit reload obtains the current version', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  let current = configuredPix();

  installReceiving(api, () => current);
  api.respond('PUT', settingsRoute, ({ body }) => {
    if (body.version === 1) {
      current = configuredPix({ version: 2, merchantName: 'Updated account' });

      return { status: 409, json: { success: false } };
    }

    const { confirmed, ...fields } = body;

    current = configuredPix({ ...fields, version: body.version + 1 });

    return success(current);
  });

  await page.goto('/settings?tab=receiving');

  const section = receivingSection(page);
  const name = section.getByLabel('Nome exibido do recebedor', { exact: true });
  const save = section.getByRole('button', { name: 'Salvar dados de recebimento' });
  const confirm = section.getByRole('checkbox', { name: /Confirmei no meu banco/ });

  await expect(name).toHaveValue('Fixture business');
  await name.fill('Unsaved account');
  await confirm.check();
  await save.click();

  await expect(section.getByRole('alert')).toHaveText('Os dados de recebimento foram alterados. Atualize antes de tentar novamente.');
  await expect(name).toBeDisabled();
  await expect(save).toBeDisabled();
  await section.getByRole('button', { name: 'Atualizar', exact: true }).click();

  await expect(name).toHaveValue('Updated account');
  await expect(name).toBeEnabled();
  await expect(confirm).not.toBeChecked();
  await name.fill('Final account');
  await confirm.check();
  await save.click();

  await expect(confirm).not.toBeChecked();
  await expect(name).toHaveValue('Final account');
  expect(api.calls.filter((call) => call.path === settingsRoute && call.method === 'PUT').map((call) => call.body.version)).toEqual([1, 2]);
});

test('does not fetch private receiving or provider settings for members', async ({ page, api }) => {
  await installAuthenticatedApp(page, api, { organizations: [{ ...organization, role: 'MEMBER' }] });

  await page.goto('/settings?tab=receiving');

  await expect(page.getByText('Somente o proprietário do negócio pode consultar ou alterar a conta recebedora.', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Chave Pix', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Mercado Pago', exact: true })).toHaveCount(0);
  expect(api.calls.filter((call) => call.path === settingsRoute || call.path === connectionRoute)).toHaveLength(0);
});

test('shows read-only settings when encryption is disabled without allowing a mutation', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  installReceiving(api, () => receivingSettings({ encryptionAvailable: false, canConfigure: false }));

  await page.goto('/settings?tab=receiving');

  const section = receivingSection(page);

  await expect(section.getByText('O recurso de recebimentos ainda não está habilitado na API. Contate o administrador da plataforma.')).toBeVisible();
  await expect(section.getByRole('checkbox', { name: 'Cadastrar destino Pix' })).toBeDisabled();
  await expect(section.getByRole('button', { name: 'Remover dados Pix' })).toHaveCount(0);
  expect(api.calls.filter((call) => call.path === settingsRoute && call.method === 'PUT')).toHaveLength(0);
});
