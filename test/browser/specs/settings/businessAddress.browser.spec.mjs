import { expect, success, test } from '../../support/api.fixture.mjs';
import { installAuthenticatedApp } from '../../support/authenticatedApp.fixture.mjs';
import { businessProfile, profileRoute } from '../../support/settings.fixture.mjs';

const statesRoute = '/api/address/states';
const postalRoute = '/api/address/postal-codes/30123456';
const states = [
  { code: 'MG', name: 'Minas Gerais' },
  { code: 'SP', name: 'São Paulo' },
];

test.beforeEach(async ({ page, api }) => {
  await installAuthenticatedApp(page, api);

  api.respond('GET', statesRoute, () => success(states));
  api.respond('GET', statesRoute + '/MG/cities', () => success([{ code: '3106200', name: 'Belo Horizonte' }]));
  api.respond('GET', statesRoute + '/SP/cities', () => success([{ code: '3550308', name: 'São Paulo' }]));
});

test('looks up a complete postal code and saves the normalized address without changing other settings', async ({
  page,
  api,
}) => {
  let current = businessProfile({ autoQuoteFollowUpEnabled: true });

  api.respond('GET', profileRoute, () => success(current));
  api.respond('GET', postalRoute, () =>
    success({
      postalCode: '30123456',
      street: 'Fixture street',
      neighborhood: 'Fixture neighborhood',
      city: 'Belo Horizonte',
      state: 'MG',
      cityIbgeCode: '3106200',
      stateIbgeCode: '31',
    }),
  );
  api.respond('PATCH', profileRoute, ({ body }) => {
    current = { ...current, ...body };

    return success(current);
  });

  await page.goto('/settings?tab=business');

  const main = page.getByRole('main');
  const postalCode = main.getByLabel('CEP', { exact: true });
  const lookup = main.getByRole('button', { name: 'Buscar CEP', exact: true });
  const state = main.getByLabel('Estado', { exact: true });

  await expect(state.locator('option[value="MG"]')).toHaveCount(1);
  await expect(lookup).toBeDisabled();
  await postalCode.fill('30123');
  await expect(lookup).toBeDisabled();
  expect(api.calls.filter((call) => call.path.startsWith('/api/address/postal-codes/'))).toHaveLength(0);

  await postalCode.fill('30123456');
  await expect(lookup).toBeEnabled();
  await lookup.click();

  await expect(
    main.getByRole('status').filter({ hasText: 'Endereço encontrado: Fixture neighborhood, Belo Horizonte/MG.' }),
  ).toBeVisible();
  await expect(postalCode).toHaveValue('30123-456');
  await expect(main.getByLabel('Endereço', { exact: true })).toHaveValue('Fixture street');
  await expect(state).toHaveValue('MG');
  await expect(main.getByLabel('Cidade', { exact: true })).toHaveValue('Belo Horizonte');

  await main.getByLabel('Endereço', { exact: true }).fill('  Fixture street, 42  ');
  await main.getByLabel('Complemento', { exact: true }).fill('  Sala 2  ');
  await main.getByRole('button', { name: 'Salvar alterações', exact: true }).click();

  await expect(main.getByText('Dados do negócio atualizados com sucesso.', { exact: true })).toBeVisible();

  const writes = api.calls.filter((call) => call.path === profileRoute && call.method === 'PATCH');

  expect(writes).toHaveLength(1);
  expect(writes[0].body).toMatchObject({
    postalCode: '30123456',
    addressLine1: 'Fixture street, 42',
    addressLine2: 'Sala 2',
    city: 'Belo Horizonte',
    state: 'MG',
  });
  expect(writes[0].body).not.toHaveProperty('autoQuoteFollowUpEnabled');
  expect(api.calls.filter((call) => call.path === postalRoute)).toHaveLength(1);
});

test('clears a previously selected city when switching states and loads only the corresponding city options', async ({
  page,
  api,
}) => {
  api.respond('GET', profileRoute, () =>
    success(
      businessProfile({
        city: 'Belo Horizonte',
        state: 'MG',
      }),
    ),
  );

  await page.goto('/settings?tab=business');

  const main = page.getByRole('main');
  const state = main.getByLabel('Estado', { exact: true });
  const city = main.getByLabel('Cidade', { exact: true });

  await expect(state.locator('option[value="SP"]')).toHaveCount(1);
  await expect(state).toHaveValue('MG');
  await expect(city).toHaveValue('Belo Horizonte');
  await state.selectOption('SP');
  await expect(city).toHaveValue('');
  await expect(city.locator('option[value="Belo Horizonte"]')).toHaveCount(0);

  await city.focus();
  await expect(city.locator('option[value="São Paulo"]')).toHaveCount(1);
  await city.selectOption('São Paulo');

  await expect(city).toHaveValue('São Paulo');
  expect(api.calls.filter((call) => call.path === statesRoute + '/SP/cities')).toHaveLength(1);
  expect(api.calls.filter((call) => call.path === profileRoute && call.method === 'PATCH')).toHaveLength(0);
});

test('keeps existing address fields after an unavailable postal lookup and supports a subsequent retry', async ({
  page,
  api,
}) => {
  api.respond('GET', profileRoute, () =>
    success(
      businessProfile({
        addressLine1: 'Existing fixture address',
      }),
    ),
  );

  let unavailable = true;

  api.respond('GET', postalRoute, () =>
    unavailable
      ? { status: 503, json: { success: false } }
      : success({
          postalCode: '30123456',
          street: null,
          neighborhood: null,
          city: 'Belo Horizonte',
          state: 'MG',
          cityIbgeCode: null,
          stateIbgeCode: null,
        }),
  );

  await page.goto('/settings?tab=business');

  const main = page.getByRole('main');
  const lookup = main.getByRole('button', { name: 'Buscar CEP', exact: true });
  const address = main.getByLabel('Endereço', { exact: true });
  const error = main
    .getByRole('alert')
    .filter({ hasText: 'O serviço de endereços está temporariamente indisponível.' });

  await expect(address).toHaveValue('Existing fixture address');
  await main.getByLabel('CEP', { exact: true }).fill('30123456');
  await lookup.click();

  await expect(error).toBeVisible();
  await expect(address).toHaveValue('Existing fixture address');

  unavailable = false;
  await lookup.click();

  await expect(error).toHaveCount(0);
  await expect(main.getByRole('status').filter({ hasText: 'Endereço encontrado: Belo Horizonte/MG.' })).toBeVisible();
  await expect(address).toHaveValue('Existing fixture address');
  await expect(main.getByLabel('Cidade', { exact: true })).toHaveValue('Belo Horizonte');
  expect(api.calls.filter((call) => call.path === postalRoute)).toHaveLength(2);
});
