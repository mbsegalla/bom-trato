import { test, expect, success } from '../../support/api.fixture.mjs';
import { date, installAuthenticatedApp, organization } from '../../support/authenticatedApp.fixture.mjs';
const currentId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const otherId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const route = '/api/auth/sessions';

function session(id, current) {
  return {
    id,
    current,
    createdAt: date,
    lastRefreshedAt: date,
    absoluteExpiresAt: '2030-01-01T00:00:00Z',
    userAgent: null,
  };
}

test('revokes another device only after confirmation and preserves the current login', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  api.respond('GET', route, () => success([session(currentId, true), session(otherId, false)]));
  api.respond('GET', '/api/auth/identities', () => success({ providers: ['GOOGLE'] }));
  api.respond('DELETE', route + '/' + otherId, () => success(null));

  await page.goto('/settings?tab=security');

  const main = page.getByRole('main');
  const revoke = main.getByRole('button', { name: 'Encerrar', exact: true });

  await expect(main.getByText('Google conectado', { exact: true })).toBeVisible();
  await expect(main.getByText('Este dispositivo', { exact: true })).toBeVisible();
  await revoke.click();

  const dialog = main.getByRole('alertdialog', { name: 'Encerrar sessão?' });

  await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(dialog).toBeHidden();
  expect(api.calls.filter((call) => call.method === 'DELETE')).toHaveLength(0);

  await revoke.click();
  await dialog.getByRole('button', { name: 'Encerrar sessão', exact: true }).click();

  await expect(dialog).toBeHidden();
  await expect(revoke).toHaveCount(0);
  await expect(main.getByRole('button', { name: 'Sair deste dispositivo', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/settings\?tab=security$/);
  expect(api.calls.filter((call) => call.path === route + '/' + otherId && call.method === 'DELETE')).toHaveLength(1);
});
