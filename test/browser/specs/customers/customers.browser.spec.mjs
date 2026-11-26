import { expect, success, test } from '../../support/api.fixture.mjs';
import {
  customer,
  installAuthenticatedApp,
  organizationId,
  organizationRoute,
} from '../../support/authenticatedApp.fixture.mjs';

const route = organizationRoute(organizationId, 'customers');

test('paginates customer results, trims search and resets the page when filters change', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  api.respond('GET', route, (call) => {
    const currentPage = Number(call.query.page);

    if (call.query.search || call.query.status === 'ARCHIVED') {
      return success({ items: [], page: currentPage, hasMore: false });
    }

    return success({
      items: [customer({ name: currentPage === 1 ? 'First customer' : 'Second customer' })],
      page: currentPage,
      hasMore: currentPage === 1,
    });
  });

  await page.goto('/customers');

  await expect(page.getByRole('link', { name: 'First customer', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Página anterior' })).toBeDisabled();
  await page.getByRole('button', { name: 'Próxima página' }).click();
  await expect(page.getByRole('link', { name: 'Second customer', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Próxima página' })).toBeDisabled();

  await page.getByPlaceholder('Buscar por nome...').fill('  Cliente & Cia  ');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Nenhum cliente encontrado' })).toBeVisible();

  await page.getByRole('button', { name: 'Limpar busca' }).click();
  await expect(page.getByRole('link', { name: 'First customer', exact: true })).toBeVisible();

  await page.getByRole('group', { name: 'Status dos clientes' }).getByRole('button', { name: 'Arquivados' }).click();
  await expect(page.getByRole('heading', { name: 'Nenhum cliente arquivado' })).toBeVisible();

  const queries = api.calls.filter((call) => call.path === route).map((call) => call.query);

  expect(queries.map((query) => [query.page, query.status, query.search ?? ''])).toEqual([
    ['1', 'ACTIVE', ''],
    ['2', 'ACTIVE', ''],
    ['1', 'ACTIVE', 'Cliente & Cia'],
    ['1', 'ACTIVE', ''],
    ['1', 'ARCHIVED', ''],
  ]);
});

test('validates a customer before submitting, saves normalized fields and refreshes the list', async ({
  page,
  api,
}) => {
  await installAuthenticatedApp(page, api);

  let saved = null;

  api.respond('GET', route, () => success({ items: saved ? [saved] : [], page: 1, hasMore: false }));
  api.respond('POST', route, (call) => {
    saved = customer(call.body);

    return success(saved);
  });

  await page.goto('/customers');
  await expect(page.getByRole('heading', { name: 'Ainda não há clientes por aqui' })).toBeVisible();
  await page.getByRole('button', { name: 'Novo cliente', exact: true }).click();

  const dialog = page.getByRole('dialog', { name: 'Novo cliente' });

  await dialog.getByLabel('Nome *', { exact: true }).fill('A');
  await dialog.getByLabel('Telefone *', { exact: true }).fill('34999991234');
  await dialog.getByRole('button', { name: 'Cadastrar cliente' }).click();

  await expect(
    dialog.getByRole('alert').filter({ hasText: 'Informe um nome com pelo menos 2 caracteres.' }),
  ).toBeVisible();
  expect(api.calls.filter((call) => call.path === route && call.method === 'POST')).toHaveLength(0);

  await dialog.getByLabel('Nome *', { exact: true }).fill('  Cliente Teste  ');
  await dialog.getByLabel('Observações', { exact: true }).fill('  Fixture note  ');
  await dialog.getByRole('button', { name: 'Cadastrar cliente' }).click();

  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Cliente Teste', exact: true })).toBeVisible();

  const writes = api.calls.filter((call) => call.path === route && call.method === 'POST');

  expect(writes).toHaveLength(1);
  expect(writes[0].body).toEqual({
    name: 'Cliente Teste',
    email: null,
    phone: '34999991234',
    defaultServiceAddress: null,
    notes: 'Fixture note',
  });
  expect(writes[0].headers['x-csrf-token']).toBe('fixture-csrf');
});

test('recovers an unavailable customer list only after an explicit retry', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  let unavailable = true;

  api.respond('GET', route, () =>
    unavailable ? { status: 503, json: { success: false } } : success({ items: [customer()], page: 1, hasMore: false }),
  );

  await page.goto('/customers');
  await expect(page.getByRole('alert').filter({ hasText: 'Os clientes estão sendo atualizados.' })).toBeVisible();

  unavailable = false;

  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Fixture customer', exact: true })).toBeVisible();
  expect(api.calls.filter((call) => call.path === route)).toHaveLength(2);
});
