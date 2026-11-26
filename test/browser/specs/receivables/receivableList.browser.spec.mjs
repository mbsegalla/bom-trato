import { test, expect, success } from '../../support/api.fixture.mjs';
import { installAuthenticatedApp, organizationId, organizationRoute } from '../../support/authenticatedApp.fixture.mjs';
import { financialSummary, pageResult, receivable, receivableId, workOrderId } from '../../support/operationalRecords.fixture.mjs';

const route = organizationRoute(organizationId, 'receivables');
const financialRoute = organizationRoute(organizationId, 'dashboard/financial');

test('renders integer-cent amounts and forwards combined status and overdue filters', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  api.respond('GET', financialRoute, ({ query }) => success(financialSummary(query)));
  api.respond('GET', route, ({ query }) => success(pageResult([
    receivable({ title: query.overdue === 'true' ? 'Overdue balance' : 'Current balance', overdue: query.overdue === 'true' }),
  ], Number(query.page))));

  await page.goto('/receivables');

  const main = page.getByRole('main');
  const table = main.getByRole('table');

  await expect(main.getByRole('heading', { name: 'Recebíveis', exact: true })).toBeVisible();
  await expect(main.getByText(/R\$\s*456,78/, { exact: false })).toBeVisible();
  await expect(main.getByText(/R\$\s*987,65/, { exact: false })).toBeVisible();

  const current = table.getByRole('row').filter({ hasText: 'Current balance' });

  await expect(current.getByRole('link', { name: 'Current balance' })).toHaveAttribute('href', '/receivables/' + receivableId);
  await expect(current.getByText(/R\$\s*125,50/)).toBeVisible();
  await expect(current.getByText(/R\$\s*25,50/)).toBeVisible();
  await expect(current.getByText(/R\$\s*100,00/)).toBeVisible();

  const partial = main.getByRole('group', { name: 'Status dos recebíveis' }).getByRole('button', { name: 'Parciais' });

  await partial.click();
  await expect.poll(() => api.calls.filter((call) => call.path === route && call.query.status === 'PARTIALLY_PAID').length).toBe(1);

  await main.getByRole('combobox').selectOption('OVERDUE');

  const overdue = table.getByRole('row').filter({ hasText: 'Overdue balance' });

  await expect(overdue.getByText('Em atraso', { exact: true })).toBeVisible();
  await expect(partial).toHaveAttribute('aria-pressed', 'true');

  const last = api.calls.filter((call) => call.path === route).at(-1);

  expect(last.query).toMatchObject({ page: '1', status: 'PARTIALLY_PAID', overdue: 'true' });
});

test('scopes a work-order receivable view and fetches financial totals only after clearing that scope', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  api.respond('GET', financialRoute, ({ query }) => success(financialSummary(query)));
  api.respond('GET', route, ({ query }) => success(pageResult([
    receivable({ title: query.workOrderId ? 'Scoped balance' : 'All balances' }),
  ])));

  await page.goto('/receivables?workOrderId=' + workOrderId);

  const main = page.getByRole('main');

  await expect(main.getByText('Exibindo os recebíveis desta ordem de serviço.', { exact: true })).toBeVisible();
  await expect(main.getByRole('link', { name: 'Scoped balance', exact: true })).toBeVisible();
  expect(api.calls.filter((call) => call.path === financialRoute)).toHaveLength(0);
  expect(api.calls.find((call) => call.path === route).query.workOrderId).toBe(workOrderId);

  await main.getByRole('button', { name: 'Ver todos', exact: true }).click();
  await expect(page).toHaveURL(/\/receivables$/);
  await expect(main.getByRole('link', { name: 'All balances', exact: true })).toBeVisible();
  await expect(main.getByText(/R\$\s*456,78/)).toBeVisible();

  expect(api.calls.filter((call) => call.path === financialRoute)).toHaveLength(1);
  expect(api.calls.filter((call) => call.path === route).at(-1).query.workOrderId).toBeUndefined();
});

test('reports a failed receivable refresh without replacing the last valid financial list', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  api.respond('GET', financialRoute, ({ query }) => success(financialSummary(query)));
  api.respond('GET', route, ({ query }) => query.overdue === 'true'
    ? { status: 503, json: { success: false } }
    : success(pageResult([receivable()])));

  await page.goto('/receivables');

  const main = page.getByRole('main');

  await expect(main.getByRole('link', { name: 'Fixture receivable', exact: true })).toBeVisible();
  await main.getByRole('combobox').selectOption('OVERDUE');

  await expect(main.getByRole('alert').filter({ hasText: 'Os recebíveis estão sendo atualizados.' })).toBeVisible();
  await expect(main.getByRole('link', { name: 'Fixture receivable', exact: true })).toBeVisible();

  await main.getByRole('combobox').selectOption('ALL');
  await expect(main.getByRole('alert').filter({ hasText: 'Os recebíveis estão sendo atualizados.' })).toHaveCount(0);
  await expect.poll(() => api.calls.filter((call) => call.path === route).length).toBe(3);
});
