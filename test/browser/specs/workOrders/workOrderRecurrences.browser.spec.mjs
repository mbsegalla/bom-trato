import { expect, success, test } from '../../support/api.fixture.mjs';
import { installAuthenticatedApp } from '../../support/authenticatedApp.fixture.mjs';
import { quoteId, workOrderId } from '../../support/operationalRecords.fixture.mjs';
import {
  listRoute,
  recurrence,
  recurrenceItem,
  recurrencePage,
  recurrenceRoute,
  recurrenceView,
} from '../../support/recurrence.fixture.mjs';

const secondId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const thirdId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

test('paginates services and resets the page when searching and filtering by visit date or status', async ({
  page,
  api,
}) => {
  await installAuthenticatedApp(page, api);
  const first = recurrenceItem();
  const second = recurrenceItem({ workOrderId: secondId, title: 'Second fixture service' });
  const matching = recurrenceItem({
    workOrderId: thirdId,
    title: 'Matched fixture service',
    customerName: 'Maria fixture',
  });

  api.respond('GET', listRoute, ({ query }) => {
    if (query.customerName) return success(recurrencePage([matching]));
    if (query.page === '2') return success(recurrencePage([second], { page: 2 }));

    return success(recurrencePage([first], { hasMore: true }));
  });

  await page.goto('/recurring-services');

  const main = page.getByRole('main');

  await expect(main.getByRole('heading', { name: 'Serviços recorrentes', exact: true })).toBeVisible();
  await expect(main.getByRole('link', { name: first.title, exact: true })).toBeVisible();
  await main.getByRole('button', { name: 'Próxima página', exact: true }).click();
  await expect(main.getByRole('link', { name: second.title, exact: true })).toBeVisible();
  await expect(main.getByText('Página 2', { exact: true })).toBeVisible();

  await main.getByLabel('Cliente', { exact: true }).fill('  Maria fixture  ');
  await main.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(main.getByRole('link', { name: matching.title, exact: true })).toBeVisible();

  const queries = () => api.calls.filter((call) => call.path === listRoute).map((call) => call.query);

  await expect.poll(() => queries().at(-1)).toEqual({ page: '1', limit: '10', customerName: 'Maria fixture' });

  await main.locator('#recurrences-status').click();
  await page.getByRole('option', { name: 'Ativas', exact: true }).click();
  await expect
    .poll(() => queries().at(-1))
    .toEqual({
      page: '1',
      limit: '10',
      status: 'ACTIVE',
      customerName: 'Maria fixture',
    });
  await expect(main.getByRole('link', { name: matching.title, exact: true })).toBeVisible();

  await main.locator('#recurrences-visit').click();
  await page.getByRole('option', { name: 'Hoje e próximos 7 dias', exact: true }).click();
  await expect
    .poll(() => queries().at(-1))
    .toEqual({
      page: '1',
      limit: '10',
      status: 'ACTIVE',
      visit: 'NEXT_SEVEN_DAYS',
      customerName: 'Maria fixture',
    });
  await expect(main.getByRole('link', { name: matching.title, exact: true })).toBeVisible();

  await main.getByRole('button', { name: 'Limpar filtros', exact: true }).click();
  await expect(main.getByLabel('Cliente', { exact: true })).toHaveValue('');
  await expect(main.getByRole('link', { name: first.title, exact: true })).toBeVisible();
  expect(queries().at(-1)).toEqual({ page: '1', limit: '10' });
});

test('pauses and reactivates a recurrence with sequential versions without resetting automatic generation', async ({
  page,
  api,
}) => {
  await installAuthenticatedApp(page, api);
  let current = recurrence({
    lastGeneratedQuoteId: quoteId,
    lastGeneratedVisitOn: '2026-01-01',
  });

  api.respond('GET', listRoute, () => success(recurrencePage([recurrenceItem({ recurrence: current })])));
  api.respond('PUT', recurrenceRoute, ({ body }) => {
    current = { ...current, ...body, version: body.version + 1 };

    return success(recurrenceView({ recurrence: current }));
  });

  await page.goto('/recurring-services');

  const main = page.getByRole('main');
  const row = main.getByRole('row').filter({ hasText: 'Fixture recurring service' });

  await expect(row.getByRole('link', { name: 'Último orçamento gerado', exact: true })).toHaveAttribute(
    'href',
    '/quotes/' + quoteId,
  );
  await expect(row.getByText('Nos próximos 7 dias', { exact: true })).toBeVisible();
  await row.getByRole('button', { name: 'Pausar', exact: true }).click();
  await expect(row.getByText('Pausada', { exact: true })).toBeVisible();
  await expect(row.getByText('Nos próximos 7 dias', { exact: true })).toHaveCount(0);
  await expect(row.getByText('Geração automática configurada', { exact: true })).toBeVisible();

  await row.getByRole('button', { name: 'Reativar', exact: true }).click();
  await expect(row.getByText('Ativa', { exact: true })).toBeVisible();

  const writes = api.calls.filter((call) => call.path === recurrenceRoute && call.method === 'PUT');

  expect(writes.map((call) => call.body)).toEqual([
    { intervalUnit: 'MONTH', intervalCount: 1, nextVisitOn: '2026-01-16', enabled: false, version: 1 },
    { intervalUnit: 'MONTH', intervalCount: 1, nextVisitOn: '2026-01-16', enabled: true, version: 2 },
  ]);
  expect(writes.every((call) => call.headers['x-csrf-token'] === 'fixture-csrf')).toBe(true);
});

test('does not offer reactivation for archived customers or expired paused visits', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  const archived = recurrenceItem({
    title: 'Archived customer service',
    customerArchived: true,
    recurrence: recurrence({ enabled: false }),
  });
  const past = recurrenceItem({
    workOrderId: secondId,
    title: 'Expired paused service',
    recurrence: recurrence({ enabled: false, nextVisitOn: '2026-01-10' }),
  });
  const overdue = recurrenceItem({
    workOrderId: thirdId,
    title: 'Active overdue service',
    recurrence: recurrence({ nextVisitOn: '2026-01-10' }),
  });
  api.respond('GET', listRoute, () => success(recurrencePage([archived, past, overdue])));

  await page.goto('/recurring-services');

  const main = page.getByRole('main');

  await expect(main.getByText('Cliente arquivado', { exact: true })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Reativar', exact: true })).toHaveCount(0);
  await expect(main.getByRole('button', { name: 'Pausar', exact: true })).toHaveCount(1);
  await expect(main.getByText('Em atraso', { exact: true })).toHaveCount(1);
  await expect(main.getByRole('link', { name: 'Gerenciar', exact: true }).first()).toHaveAttribute(
    'href',
    '/work-orders/' + workOrderId + '#recurrence',
  );
  expect(api.calls.filter((call) => call.method === 'PUT')).toHaveLength(0);
});

test('recovers from list failures and displays restricted recurrences without mutation controls', async ({
  page,
  api,
}) => {
  await installAuthenticatedApp(page, api);
  let unavailable = true;
  api.respond('GET', listRoute, () =>
    unavailable
      ? { status: 503, json: { success: false } }
      : success(recurrencePage([recurrenceItem()], { canConfigure: false })),
  );

  await page.goto('/recurring-services');

  const main = page.getByRole('main');

  await expect(
    main.getByRole('alert').filter({ hasText: 'Não foi possível carregar os serviços recorrentes.' }),
  ).toBeVisible();

  unavailable = false;
  await main.getByRole('button', { name: 'Tentar novamente', exact: true }).click();

  await expect(
    main.getByText('As recorrências estão disponíveis apenas para consulta.', { exact: true }),
  ).toBeVisible();
  await expect(main.getByRole('link', { name: 'Consultar', exact: true })).toHaveAttribute(
    'href',
    '/work-orders/' + workOrderId + '#recurrence',
  );
  await expect(main.getByRole('button', { name: 'Pausar', exact: true })).toHaveCount(0);
  expect(api.calls.filter((call) => call.path === listRoute)).toHaveLength(2);
});
