import { expect, test } from '../../support/api.fixture.mjs';
import { installAuthenticatedApp, organizationId, organizationRoute } from '../../support/authenticatedApp.fixture.mjs';
import { installDashboard } from '../../support/dashboard.fixture.mjs';
import { workOrderId } from '../../support/operationalRecords.fixture.mjs';

const route = organizationRoute(organizationId, 'dashboard');
const quoteRoute = organizationRoute(organizationId, 'quotes');

test('renders financial and operational indicators with actionable links and tenant-scoped requests', async ({
  page,
  api,
}) => {
  await installAuthenticatedApp(page, api);
  installDashboard(api);

  await page.goto('/dashboard');

  const main = page.getByRole('main');

  await expect(main.getByRole('heading', { name: 'Seu dia, mais organizado.' })).toBeVisible();
  await expect(main.getByText('Recebido no mês', { exact: true }).locator('..')).toContainText(/R\$\s*987,65/);
  await expect(main.getByText('A receber', { exact: true }).locator('..')).toContainText(/R\$\s*456,78/);
  await expect(main.getByText('2 pagamentos registrados', { exact: true })).toBeVisible();
  await expect(main.getByText('3 cobranças pendentes', { exact: true })).toBeVisible();
  await expect(main.getByText('Serviços em andamento', { exact: true }).locator('..')).toContainText('3');
  await expect(main.getByRole('img', { name: 'Gráfico de recebimentos dos últimos 6 meses' })).toBeVisible();
  await expect(main.getByText('Total no período', { exact: true }).locator('..')).toContainText(/R\$\s*987,65/);

  await expect(main.getByRole('link', { name: /1 recebimento está em atraso/ })).toHaveAttribute(
    'href',
    '/receivables',
  );
  await expect(main.getByRole('link', { name: /1 orçamento aguarda resposta/ })).toHaveAttribute('href', '/quotes');
  await expect(main.getByRole('link', { name: /2 orçamentos enviados expiraram/ })).toHaveAttribute('href', '/quotes');
  await expect(main.getByRole('link', { name: /1 ordem de serviço aguarda planejamento/ })).toHaveAttribute(
    'href',
    '/work-orders',
  );
  await expect(main.getByRole('link', { name: /Fixture upcoming service/ })).toHaveAttribute(
    'href',
    '/work-orders/' + workOrderId,
  );
  await expect(main.getByRole('link', { name: /Fixture upcoming service/ })).toContainText('Fixture technician');

  await expect.poll(() => api.calls.filter((call) => call.path === quoteRoute).length).toBe(1);
  await expect(main.getByRole('link', { name: 'Criar primeiro orçamento', exact: true })).toHaveCount(0);

  const reads = api.calls.filter((call) => call.path.startsWith(route + '/'));

  expect(reads).toHaveLength(4);
  expect(reads.every((call) => call.method === 'GET' && call.headers.authorization === 'Bearer fixture-access')).toBe(
    true,
  );
  expect(reads.find((call) => call.path.endsWith('/upcoming-work-orders')).query).toEqual({ limit: '5' });
  expect(reads.find((call) => call.path.endsWith('/summary')).query).toEqual(
    reads.find((call) => call.path.endsWith('/financial')).query,
  );
  expect(reads.find((call) => call.path.endsWith('/financial-trend')).query.from).not.toBe(
    reads.find((call) => call.path.endsWith('/summary')).query.from,
  );
});

test('shows honest zero balances, the empty schedule and the first-quote guide', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  installDashboard(api, { empty: true });

  await page.goto('/dashboard');

  const main = page.getByRole('main');

  await expect(main.getByRole('heading', { name: 'Seu primeiro orçamento em uma etapa.' })).toBeVisible();
  await expect(main.getByRole('link', { name: 'Criar primeiro orçamento', exact: true })).toHaveAttribute(
    'href',
    '/quotes?new=1',
  );
  await expect(main.getByText('Recebido no mês', { exact: true }).locator('..')).toContainText(/R\$\s*0,00/);
  await expect(main.getByText('A receber', { exact: true }).locator('..')).toContainText(/R\$\s*0,00/);
  await expect(main.getByText('Ainda não há recebimentos neste período', { exact: true })).toBeVisible();
  await expect(main.getByText('Nenhum serviço agendado para os próximos passos.', { exact: true })).toBeVisible();
  await expect(main.getByText('Tudo em ordem por aqui.', { exact: true })).toBeVisible();
  await expect(main.getByRole('img', { name: 'Gráfico de recebimentos dos últimos 6 meses' })).toHaveCount(0);
  await expect(main.getByRole('link', { name: /recebimentos? (está|estão) em atraso/ })).toHaveCount(0);
});

test('never presents partial financial data as a successful dashboard and recovers on explicit retry', async ({
  page,
  api,
}) => {
  await installAuthenticatedApp(page, api);
  let unavailable = true;
  installDashboard(api, { financialUnavailable: () => unavailable });

  await page.goto('/dashboard');

  const main = page.getByRole('main');

  await expect(main.getByRole('heading', { name: 'Não conseguimos carregar sua visão geral' })).toBeVisible();
  await expect(
    main.getByRole('alert').filter({ hasText: 'Não foi possível carregar os dados financeiros.' }),
  ).toBeVisible();
  await expect(main.getByText('Recebido no mês', { exact: true })).toHaveCount(0);

  unavailable = false;
  await main.getByRole('button', { name: 'Tentar novamente', exact: true }).click();

  await expect(main.getByRole('heading', { name: 'Seu dia, mais organizado.' })).toBeVisible();
  await expect(main.getByText('Recebido no mês', { exact: true }).locator('..')).toContainText(/R\$\s*987,65/);
  expect(api.calls.filter((call) => call.path === route + '/financial')).toHaveLength(2);
});

test('keeps the financial overview usable when the optional first-quote guide cannot load', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  installDashboard(api, { quotesUnavailable: true });

  await page.goto('/dashboard');

  const main = page.getByRole('main');

  await expect(main.getByRole('heading', { name: 'Seu dia, mais organizado.' })).toBeVisible();
  await expect.poll(() => api.calls.filter((call) => call.path === quoteRoute).length).toBe(1);
  await expect(main.getByText('Recebido no mês', { exact: true }).locator('..')).toContainText(/R\$\s*987,65/);
  await expect(main.getByRole('link', { name: 'Criar primeiro orçamento', exact: true })).toHaveCount(0);
  await expect(main.getByRole('alert')).toHaveCount(0);
});
