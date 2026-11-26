import { test, expect, success } from '../../support/api.fixture.mjs';
import { date, installAuthenticatedApp, userId } from '../../support/authenticatedApp.fixture.mjs';
import { installWorkOrderDetails, orderDetails } from '../../support/operationalDetails.fixture.mjs';
import { workOrderId } from '../../support/operationalRecords.fixture.mjs';
import { recurrence, recurrenceRoute, recurrenceView } from '../../support/recurrence.fixture.mjs';

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
  api.respond('GET', recurrenceRoute, () => success(read()));
}

test('validates frequency and saves explicit automatic generation preferences with the current version', async ({ page, api }) => {
  let current = recurrence({ autoGenerateEnabled: false });

  await setup(page, api, () => recurrenceView({ recurrence: current }));
  api.respond('PUT', recurrenceRoute, ({ body }) => {
    current = { ...current, ...body, version: body.version + 1 };

    return success(recurrenceView({ recurrence: current }));
  });

  await page.goto('/work-orders/' + workOrderId);

  const section = page.locator('#recurrence');
  const frequency = section.getByLabel('A cada', { exact: true });
  const automatic = section.getByRole('checkbox', { name: 'Gerar orçamento automaticamente na data prevista' });
  const save = section.getByRole('button', { name: 'Salvar recorrência', exact: true });

  await expect(frequency).toHaveValue('1');
  await expect(automatic).not.toBeChecked();
  await frequency.fill('0');
  await save.click();
  await expect(page.getByText('Informe uma frequência maior que zero.', { exact: true })).toBeVisible();
  expect(api.calls.filter((call) => call.path === recurrenceRoute && call.method === 'PUT')).toHaveLength(0);

  await frequency.fill('2');
  await automatic.check();
  await save.click();
  await expect(page.getByText('Recorrência salva.', { exact: true })).toBeVisible();
  await expect(save).toBeEnabled();

  const writes = api.calls.filter((call) => call.path === recurrenceRoute && call.method === 'PUT');

  expect(writes).toHaveLength(1);
  expect(writes[0].body).toEqual({
    intervalUnit: 'MONTH', intervalCount: 2, nextVisitOn: '2026-01-16',
    enabled: true, autoGenerateEnabled: true, version: 1,
  });
});

test('requires refreshing a stale configuration before allowing another write', async ({ page, api }) => {
  let current = recurrence();
  let conflict = true;

  await setup(page, api, () => recurrenceView({ recurrence: current }));
  api.respond('PUT', recurrenceRoute, ({ body }) => {
    if (conflict) {
      current = recurrence({ version: 2, intervalCount: 3 });

      return { status: 409, json: { success: false } };
    }

    current = { ...current, ...body, version: body.version + 1 };

    return success(recurrenceView({ recurrence: current }));
  });

  await page.goto('/work-orders/' + workOrderId);

  const section = page.locator('#recurrence');
  const save = section.getByRole('button', { name: 'Salvar recorrência', exact: true });

  await save.click();
  await expect(section.getByRole('alert')).toHaveText('Atualize a recorrência para consultar a configuração atual antes de tentar novamente.');
  await expect(save).toHaveCount(0);

  conflict = false;
  await section.getByRole('button', { name: 'Atualizar', exact: true }).click();
  await expect(section.getByLabel('A cada', { exact: true })).toHaveValue('3');
  await section.getByRole('checkbox', { name: 'Manter recorrência ativa' }).uncheck();
  await save.click();
  await expect(section.getByText('Recorrência pausada', { exact: true })).toBeVisible();

  const writes = api.calls.filter((call) => call.path === recurrenceRoute && call.method === 'PUT');

  expect(writes.map((call) => call.body.version)).toEqual([1, 2]);
  expect(writes[1].body).toMatchObject({ intervalCount: 3, enabled: false, autoGenerateEnabled: true });
});
