import { expect, success, test } from '../../support/api.fixture.mjs';
import { date, installAuthenticatedApp, userId } from '../../support/authenticatedApp.fixture.mjs';
import { installWorkOrderDetails, orderDetails, workOrderRoute } from '../../support/operationalDetails.fixture.mjs';
import { workOrderId } from '../../support/operationalRecords.fixture.mjs';

const route = workOrderRoute + '/warranty';

async function setup(page, api, read) {
  await installAuthenticatedApp(page, api);
  const order = orderDetails({
    status: 'COMPLETED',
    assignedToId: userId,
    serviceAddress: 'Fixture address',
    startedAt: date,
    completedAt: date,
  });

  installWorkOrderDetails(api, () => order);
  api.respond('GET', route, () => success(read()));
}

function warrantySection(page) {
  return page
    .getByRole('main')
    .locator('section')
    .filter({
      has: page.getByRole('heading', { name: 'Relatório e garantia do serviço', exact: true }),
    });
}

test('validates warranty duration and persists normalized terms with sequential versions', async ({ page, api }) => {
  let current = { warranty: null, locked: false };
  await setup(page, api, () => current);
  api.respond('PUT', route, ({ body }) => {
    current = {
      locked: false,
      warranty: {
        ...body,
        version: body.version + 1,
        expiresAt: new Date(new Date(date).getTime() + body.durationDays * 86400000).toISOString(),
      },
    };

    return success(current);
  });

  await page.goto('/work-orders/' + workOrderId);

  const section = warrantySection(page);
  const duration = section.getByLabel('Prazo em dias corridos', { exact: true });
  const terms = section.getByLabel('Condições da garantia comercial', { exact: true });
  const save = section.getByRole('button', { name: 'Salvar condições', exact: true });

  await expect(duration).toHaveValue('');
  await terms.fill('  Fixture warranty conditions  ');
  await duration.fill('0');
  await save.click();
  await expect(page.getByText('Informe pelo menos 1 dia.', { exact: true })).toBeVisible();
  expect(api.calls.filter((call) => call.path === route && call.method === 'PUT')).toHaveLength(0);

  await duration.fill('90');
  await save.click();
  await expect(terms).toHaveValue('Fixture warranty conditions');
  await expect(section.getByText(/Data de referência do término:/)).toBeVisible();

  await duration.fill('30');
  await save.click();
  await expect(save).toBeEnabled();
  await expect.poll(() => api.calls.filter((call) => call.path === route && call.method === 'PUT').length).toBe(2);

  const writes = api.calls.filter((call) => call.path === route && call.method === 'PUT');

  expect(writes.map((call) => call.body)).toEqual([
    { durationDays: 90, terms: 'Fixture warranty conditions', version: 0 },
    { durationDays: 30, terms: 'Fixture warranty conditions', version: 1 },
  ]);
});

test('refreshes a conflicting warranty and removes editing controls when acceptance locks it', async ({
  page,
  api,
}) => {
  let current = {
    locked: false,
    warranty: { durationDays: 90, terms: 'Original fixture terms', version: 1, expiresAt: '2026-04-01T00:00:00Z' },
  };
  await setup(page, api, () => current);
  api.respond('PUT', route, () => {
    current = { ...current, locked: true };

    return { status: 409, json: { success: false } };
  });

  await page.goto('/work-orders/' + workOrderId);

  const section = warrantySection(page);
  const terms = section.getByLabel('Condições da garantia comercial', { exact: true });

  await expect(terms).toHaveValue('Original fixture terms');
  await terms.fill('Unsaved changes');
  await section.getByRole('button', { name: 'Salvar condições', exact: true }).click();

  await expect(
    section.getByText(
      'As condições de garantia não podem ser alteradas após o aceite da conclusão ou cancelamento da OS.',
      { exact: true },
    ),
  ).toBeVisible();
  await expect(terms).toHaveValue('Original fixture terms');
  await expect(terms).toBeDisabled();
  await expect(section.getByLabel('Prazo em dias corridos', { exact: true })).toBeDisabled();
  await expect(section.getByRole('button', { name: 'Salvar condições', exact: true })).toHaveCount(0);
  await expect(section.getByRole('button', { name: 'Baixar relatório PDF', exact: true })).toBeEnabled();
  expect(api.calls.filter((call) => call.path === route && call.method === 'PUT')).toHaveLength(1);
});
