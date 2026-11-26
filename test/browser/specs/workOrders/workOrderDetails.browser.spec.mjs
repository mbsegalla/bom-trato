import { test, expect, success } from '../../support/api.fixture.mjs';
import { date, installAuthenticatedApp, userId } from '../../support/authenticatedApp.fixture.mjs';
import { workOrderId } from '../../support/operationalRecords.fixture.mjs';
import { installWorkOrderDetails, orderDetails, workOrderRoute } from '../../support/operationalDetails.fixture.mjs';

test('requires a service address and assigned professional before enabling scheduling and execution', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  let current = orderDetails();

  installWorkOrderDetails(api, () => current);
  api.respond('PATCH', workOrderRoute, ({ body }) => {
    current = { ...current, ...body, version: 2 };

    return success(current);
  });
  api.respond('POST', workOrderRoute + '/assign', ({ body }) => {
    current = { ...current, assignedToId: body.assignedToId, version: 3 };

    return success(current);
  });

  await page.goto('/work-orders/' + workOrderId);

  const main = page.getByRole('main');
  const schedule = main.getByRole('button', { name: 'Agendar', exact: true });
  const start = main.getByRole('button', { name: 'Iniciar serviço', exact: true });

  await expect(main.getByRole('heading', { name: 'Complete o planejamento', exact: true })).toBeVisible();
  await expect(schedule).toBeDisabled();
  await expect(start).toHaveCount(0);

  await main.getByRole('button', { name: 'Planejamento', exact: true }).click();

  const form = main.locator('form').filter({ has: page.locator('#work-order-title') });

  await form.getByLabel('Endereço do serviço', { exact: true }).fill('  Fixture address  ');
  await form.getByRole('button', { name: 'Salvar planejamento', exact: true }).click();
  await expect(form).toBeHidden();
  await expect(main.getByText('Fixture address', { exact: true })).toBeVisible();
  await expect(schedule).toBeDisabled();

  await main.getByRole('button', { name: 'Responsável', exact: true }).click();
  await main.getByLabel('Responsável', { exact: true }).selectOption(userId);
  await main.getByRole('button', { name: 'Salvar responsável', exact: true }).click();

  await expect(main.getByRole('heading', { name: 'Pronta para execução', exact: true })).toBeVisible();
  await expect(schedule).toBeEnabled();
  await expect(start).toBeEnabled();

  const planning = api.calls.filter((call) => call.path === workOrderRoute && call.method === 'PATCH');
  const assignment = api.calls.filter((call) => call.path === workOrderRoute + '/assign');

  expect(planning).toHaveLength(1);
  expect(planning[0].body).toEqual({ version: 1, title: current.title, instructions: null, serviceAddress: 'Fixture address' });
  expect(assignment).toHaveLength(1);
  expect(assignment[0].body).toEqual({ version: 2, assignedToId: userId });
});

test('starts, saves execution notes and completes the service with sequential versions and locked editing', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  let current = orderDetails({ assignedToId: userId, serviceAddress: 'Fixture address' });

  installWorkOrderDetails(api, () => current);
  api.respond('POST', workOrderRoute + '/start', () => {
    current = { ...current, status: 'IN_PROGRESS', startedAt: date, version: 2 };

    return success(current);
  });
  api.respond('PATCH', workOrderRoute + '/execution-notes', ({ body }) => {
    current = { ...current, executionNotes: body.executionNotes, version: 3 };

    return success(current);
  });
  api.respond('POST', workOrderRoute + '/complete', () => {
    current = { ...current, status: 'COMPLETED', completedAt: date, version: 4 };

    return success(current);
  });

  await page.goto('/work-orders/' + workOrderId);

  const main = page.getByRole('main');

  await main.getByRole('button', { name: 'Iniciar serviço', exact: true }).click();
  const startDialog = main.getByRole('alertdialog', { name: 'Iniciar o serviço?' });

  await startDialog.getByRole('button', { name: 'Iniciar serviço', exact: true }).click();
  await expect(startDialog).toBeHidden();
  await expect(main.getByText('Em andamento', { exact: true })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Planejamento', exact: true })).toHaveCount(0);

  const notes = main.getByPlaceholder('Registre informações importantes durante a execução do serviço.');

  await notes.fill('  Fixture execution completed  ');
  await main.getByRole('button', { name: 'Salvar observações', exact: true }).click();
  await expect(notes).toHaveValue('Fixture execution completed');

  await main.getByRole('button', { name: 'Concluir serviço', exact: true }).click();

  const completeDialog = main.getByRole('alertdialog', { name: 'Concluir o serviço?' });

  await completeDialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(completeDialog).toBeHidden();
  expect(api.calls.filter((call) => call.path === workOrderRoute + '/complete')).toHaveLength(0);

  await main.getByRole('button', { name: 'Concluir serviço', exact: true }).click();
  await completeDialog.getByRole('button', { name: 'Concluir serviço', exact: true }).click();

  await expect(completeDialog).toBeHidden();
  await expect(main.getByRole('button', { name: 'Ver recebíveis', exact: true })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Concluir serviço', exact: true })).toHaveCount(0);
  await expect(main.getByRole('button', { name: 'Salvar observações', exact: true })).toHaveCount(0);
  await expect(notes).toHaveAttribute('readonly', '');

  const writes = api.calls.filter((call) => call.path.startsWith(workOrderRoute) && ['POST', 'PATCH'].includes(call.method));

  expect(writes.map(({ path, body }) => [path, body])).toEqual([
    [workOrderRoute + '/start', { version: 1 }],
    [workOrderRoute + '/execution-notes', { version: 2, executionNotes: 'Fixture execution completed' }],
    [workOrderRoute + '/complete', { version: 3 }],
  ]);
});

test('does not advance a stale order after the backend refuses the start transition', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  const current = orderDetails({ assignedToId: userId, serviceAddress: 'Fixture address' });

  installWorkOrderDetails(api, () => current);
  api.respond('POST', workOrderRoute + '/start', () => ({ status: 409, json: { success: false } }));

  await page.goto('/work-orders/' + workOrderId);

  const main = page.getByRole('main');

  await main.getByRole('button', { name: 'Iniciar serviço', exact: true }).click();
  const dialog = main.getByRole('alertdialog', { name: 'Iniciar o serviço?' });

  await dialog.getByRole('button', { name: 'Iniciar serviço', exact: true }).click();

  await expect(main.getByRole('alert').filter({ hasText: 'A ordem de serviço foi alterada' })).toBeVisible();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(main.getByRole('button', { name: 'Iniciar serviço', exact: true })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Concluir serviço', exact: true })).toHaveCount(0);
  expect(api.calls.filter((call) => call.path === workOrderRoute + '/start')).toHaveLength(1);
});
