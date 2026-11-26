import { expect, success, test } from '../../support/api.fixture.mjs';
import { installAuthenticatedApp, organizationId, organizationRoute } from '../../support/authenticatedApp.fixture.mjs';
import { pageResult, workOrder, workOrderId } from '../../support/operationalRecords.fixture.mjs';

const route = organizationRoute(organizationId, 'work-orders');

test('shows an unassigned order and resets page and status when selecting completed services', async ({
  page,
  api,
}) => {
  await installAuthenticatedApp(page, api);
  api.respond('GET', route, ({ query }) => {
    const current = Number(query.page);

    if (query.status === 'COMPLETED') {
      return success(pageResult([workOrder({ title: 'Completed service', status: 'COMPLETED' })]));
    }

    return success(
      pageResult([workOrder({ title: current === 1 ? 'First service' : 'Second service' })], current, current === 1),
    );
  });

  await page.goto('/work-orders');

  const main = page.getByRole('main');

  await expect(main.getByRole('heading', { name: 'Ordens de serviço', exact: true })).toBeVisible();
  await expect(main.getByRole('link', { name: 'First service', exact: true })).toHaveAttribute(
    'href',
    '/work-orders/' + workOrderId,
  );
  await expect(main.getByText('Sem responsável', { exact: true })).toBeVisible();
  await expect(main.getByText('Ainda não agendado', { exact: true })).toBeVisible();

  await main.getByRole('button', { name: 'Próxima página' }).click();
  await expect(main.getByRole('link', { name: 'Second service', exact: true })).toBeVisible();

  const completed = main
    .getByRole('group', { name: 'Status das ordens de serviço' })
    .getByRole('button', { name: 'Concluídos' });

  await completed.click();
  await expect(completed).toHaveAttribute('aria-pressed', 'true');
  await expect(main.getByRole('link', { name: 'Completed service', exact: true })).toBeVisible();
  await expect(main.getByText('Concluída', { exact: true })).toBeVisible();

  expect(
    api.calls.filter((call) => call.path === route).map(({ query }) => [query.page, query.status ?? 'ALL']),
  ).toEqual([
    ['1', 'ALL'],
    ['2', 'ALL'],
    ['1', 'COMPLETED'],
  ]);
});

test('displays a permission error and recovers explicitly instead of treating it as an empty list', async ({
  page,
  api,
}) => {
  await installAuthenticatedApp(page, api);
  let denied = true;

  api.respond('GET', route, () => (denied ? { status: 403, json: { success: false } } : success(pageResult())));

  await page.goto('/work-orders');

  const main = page.getByRole('main');

  await expect(main.getByText('Você não tem permissão para realizar esta operação.', { exact: true })).toBeVisible();
  await expect(main.getByRole('heading', { name: 'Nenhuma ordem de serviço por aqui' })).toHaveCount(0);

  denied = false;

  await main.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
  await expect(main.getByRole('heading', { name: 'Nenhuma ordem de serviço por aqui' })).toBeVisible();
  await expect(main.getByRole('link', { name: 'Ver orçamentos', exact: true })).toHaveAttribute('href', '/quotes');

  expect(api.calls.filter((call) => call.path === route)).toHaveLength(2);
});
