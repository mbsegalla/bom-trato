import { test, expect, success } from '../../support/api.fixture.mjs';
import { installAuthenticatedApp, organizationId, organizationRoute } from '../../support/authenticatedApp.fixture.mjs';
import { catalogService, pageResult } from '../../support/operationalRecords.fixture.mjs';

const route = organizationRoute(organizationId, 'services');

test('supports literal search and archived filters without displaying incorrect empty-state actions', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  api.respond('GET', route, ({ query }) => success(pageResult(
    query.search || query.status === 'ARCHIVED' ? [] : [catalogService()],
  )));

  await page.goto('/services-catalog');

  const main = page.getByRole('main');

  await expect(main.getByRole('link', { name: 'Fixture service', exact: true })).toBeVisible();
  await expect(main.getByRole('table').getByText('1h 30min', { exact: true })).toBeVisible();

  await main.getByPlaceholder('Buscar serviço...').fill('  100% serviço  ');
  await main.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(main.getByRole('heading', { name: 'Nenhum serviço encontrado' })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Cadastrar serviço', exact: true })).toHaveCount(0);

  await main.getByRole('button', { name: 'Limpar busca' }).click();
  await expect(main.getByRole('link', { name: 'Fixture service', exact: true })).toBeVisible();

  await main.getByRole('group', { name: 'Status dos serviços' }).getByRole('button', { name: 'Arquivados' }).click();
  await expect(main.getByRole('heading', { name: 'Nenhum serviço arquivado' })).toBeVisible();

  expect(api.calls.filter((call) => call.path === route).map(({ query }) => [query.status, query.search ?? ''])).toEqual([
    ['ACTIVE', ''], ['ACTIVE', '100% serviço'], ['ACTIVE', ''], ['ARCHIVED', ''],
  ]);
});

test('validates and creates a catalog service using cents and a combined duration', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  let saved = null;

  api.respond('GET', route, () => success(pageResult(saved ? [saved] : [])));
  api.respond('POST', route, ({ body }) => {
    saved = catalogService(body);

    return success(saved);
  });

  await page.goto('/services-catalog');

  const main = page.getByRole('main');

  await expect(main.getByRole('heading', { name: 'Seu catálogo ainda está vazio' })).toBeVisible();
  await main.getByRole('button', { name: 'Novo serviço', exact: true }).click();

  const dialog = page.getByRole('dialog', { name: 'Novo serviço' });
  const submit = dialog.getByRole('button', { name: 'Cadastrar serviço' });

  await dialog.getByLabel('Nome *', { exact: true }).fill('A');
  await dialog.getByLabel('Valor padrão *', { exact: true }).fill('125,50');
  await submit.click();

  await expect(dialog.getByRole('alert').filter({ hasText: 'Informe um nome com pelo menos 2 caracteres.' })).toBeVisible();
  expect(api.calls.filter((call) => call.path === route && call.method === 'POST')).toHaveLength(0);

  await dialog.getByLabel('Nome *', { exact: true }).fill('  Instalação de teste  ');
  await dialog.getByLabel('Horas', { exact: true }).fill('1');
  await dialog.getByLabel('Minutos', { exact: true }).fill('30');
  await submit.click();

  await expect(dialog).toBeHidden();
  await expect(main.getByRole('link', { name: 'Instalação de teste', exact: true })).toBeVisible();

  const writes = api.calls.filter((call) => call.path === route && call.method === 'POST');

  expect(writes).toHaveLength(1);
  expect(writes[0].body).toEqual({
    name: 'Instalação de teste',
    description: null,
    unit: 'SERVICE',
    amountInCents: 12550,
    estimatedDurationMinutes: 90,
  });
  expect(writes[0].headers['x-csrf-token']).toBe('fixture-csrf');
});
