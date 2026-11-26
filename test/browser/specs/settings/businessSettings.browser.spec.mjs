import { test, expect, success } from '../../support/api.fixture.mjs';
import { date, installAuthenticatedApp, organization } from '../../support/authenticatedApp.fixture.mjs';
import { businessProfile, profileRoute } from '../../support/settings.fixture.mjs';

test('saves normalized business data with a zero-day receivable term and preserves automation preferences', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  let current = businessProfile({ autoQuoteFollowUpEnabled: true });

  api.respond('GET', profileRoute, () => success(current));
  api.respond('PATCH', profileRoute, ({ body }) => {
    current = { ...current, ...body };

    return success(current);
  });

  await page.goto('/settings?tab=business');

  const main = page.getByRole('main');
  const name = main.getByLabel('Nome do negócio *', { exact: true });

  await expect(name).toHaveValue('Fixture business');
  await name.fill('  Updated fixture business  ');
  await main.getByLabel('Prazo padrão para vencimento', { exact: true }).fill('0');
  await main.getByRole('button', { name: 'Salvar alterações', exact: true }).click();

  await expect(main.getByText('Dados do negócio atualizados com sucesso.', { exact: true })).toBeVisible();
  await expect(name).toHaveValue('Updated fixture business');
  await expect(main.getByLabel('Prazo padrão para vencimento', { exact: true })).toHaveValue('0');

  const writes = api.calls.filter((call) => call.path === profileRoute && call.method === 'PATCH');

  expect(writes).toHaveLength(1);
  expect(writes[0].body).toMatchObject({ name: 'Updated fixture business', defaultReceivableDueDays: 0, email: null });
  expect(writes[0].body).not.toHaveProperty('autoQuoteFollowUpEnabled');
  expect(writes[0].body).not.toHaveProperty('ownerId');
});

test('prevents business profile edits from nonowners while showing persisted values', async ({ page, api }) => {
  await installAuthenticatedApp(page, api, { organizations: [{ ...organization, role: 'MEMBER' }] });
  api.respond('GET', profileRoute, () => success(businessProfile({ defaultReceivableDueDays: 15 })));

  await page.goto('/settings?tab=business');

  const main = page.getByRole('main');
  const name = main.getByLabel('Nome do negócio *', { exact: true });
  const term = main.getByLabel('Prazo padrão para vencimento', { exact: true });

  await expect(name).toHaveValue('Fixture business');
  await expect(name).toHaveAttribute('readonly', '');
  await expect(term).toHaveValue('15');
  await expect(term).toHaveAttribute('readonly', '');
  await expect(main.getByRole('button', { name: 'Salvar alterações', exact: true })).toHaveCount(0);
  expect(api.calls.filter((call) => call.path === profileRoute && call.method === 'PATCH')).toHaveLength(0);
});
