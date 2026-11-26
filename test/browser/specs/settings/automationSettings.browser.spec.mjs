import { test, expect, success } from '../../support/api.fixture.mjs';
import { date, installAuthenticatedApp, organization } from '../../support/authenticatedApp.fixture.mjs';
import { automationEvent, automationRoute, businessProfile, profileRoute } from '../../support/settings.fixture.mjs';

test('saves only automation flags and renders the status of each historical delivery', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  let current = businessProfile({ autoWorkOrderReminderEnabled: true });

  api.respond('GET', profileRoute, () => success(current));
  api.respond('GET', automationRoute, () => success({ items: [
    automationEvent(),
    automationEvent({ id: 'ffffffff-ffff-4fff-8fff-ffffffffffff', description: 'Fixture failed reminder', status: 'FAILED', lastErrorCode: 'DELIVERY_FAILED' }),
  ] }));
  api.respond('PATCH', profileRoute, ({ body }) => {
    current = { ...current, ...body };

    return success(current);
  });

  await page.goto('/settings?tab=automations');

  const main = page.getByRole('main');
  const followUp = main.getByRole('switch', { name: 'Acompanhar orçamentos sem resposta' });
  const reminder = main.getByRole('switch', { name: 'Lembrar clientes de serviços agendados' });

  await expect(followUp).toHaveAttribute('aria-checked', 'false');
  await expect(reminder).toHaveAttribute('aria-checked', 'true');
  await followUp.click();
  await reminder.click();

  await main.getByRole('button', { name: 'Salvar automações', exact: true }).click();
  await expect(main.getByRole('button', { name: 'Salvar automações', exact: true })).toBeEnabled();

  const writes = api.calls.filter((call) => call.path === profileRoute && call.method === 'PATCH');

  expect(writes).toHaveLength(1);
  expect(writes[0].body).toEqual({
    autoQuoteFollowUpEnabled: true,
    autoWorkOrderReminderEnabled: false,
    autoReviewRequestEnabled: false,
    autoReceivableReminderEnabled: false,
  });

  const sent = main.getByRole('link').filter({ hasText: 'Fixture quote reminder' });
  const failed = main.getByRole('link').filter({ hasText: 'Fixture failed reminder' });

  await expect(sent).toContainText('Enviado');
  await expect(failed).toContainText('Falhou');
  await expect(sent).toHaveAttribute('href', automationEvent().href);
  await expect(followUp).toHaveAttribute('aria-checked', 'true');
});

test('keeps the edited flags after a failed save so the owner can retry explicitly', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  let current = businessProfile();
  let unavailable = true;

  api.respond('GET', profileRoute, () => success(current));
  api.respond('GET', automationRoute, () => success({ items: [] }));
  api.respond('PATCH', profileRoute, ({ body }) => {
    if (unavailable) return { status: 503, json: { success: false } };

    current = { ...current, ...body };
    return success(current);
  });

  await page.goto('/settings?tab=automations');

  const main = page.getByRole('main');
  const reminder = main.getByRole('switch', { name: 'Lembrar clientes de pagamentos' });
  const save = main.getByRole('button', { name: 'Salvar automações', exact: true });

  await reminder.click();
  await save.click();
  await expect(main.getByRole('alert').filter({ hasText: 'O negócio está sendo atualizado.' })).toBeVisible();
  await expect(reminder).toHaveAttribute('aria-checked', 'true');

  unavailable = false;
  await save.click();
  await expect(main.getByRole('alert').filter({ hasText: 'O negócio está sendo atualizado.' })).toHaveCount(0);
  await expect(save).toBeEnabled();

  const writes = api.calls.filter((call) => call.path === profileRoute && call.method === 'PATCH');

  expect(writes).toHaveLength(2);
  expect(writes[0].body).toEqual(writes[1].body);
  expect(writes[1].body.autoReceivableReminderEnabled).toBe(true);
});

test('renders automation configuration read-only for nonowners', async ({ page, api }) => {
  await installAuthenticatedApp(page, api, { organizations: [{ ...organization, role: 'MEMBER' }] });
  api.respond('GET', profileRoute, () => success(businessProfile({ autoReviewRequestEnabled: true })));
  api.respond('GET', automationRoute, () => success({ items: [] }));

  await page.goto('/settings?tab=automations');

  const main = page.getByRole('main');

  await expect(main.getByRole('heading', { name: 'Piloto Automático' })).toBeVisible();
  await expect(main.getByRole('switch')).toHaveCount(4);
  for (const toggle of await main.getByRole('switch').all()) {
    await expect(toggle).toBeDisabled();
  }
  await expect(main.getByRole('switch', { name: 'Solicitar avaliação após o serviço' })).toHaveAttribute('aria-checked', 'true');
  await expect(main.getByRole('button', { name: 'Salvar automações', exact: true })).toHaveCount(0);
  expect(api.calls.filter((call) => call.path === profileRoute && call.method === 'PATCH')).toHaveLength(0);
});
