import { test, expect, success } from '../../support/api.fixture.mjs';
import { date, installAuthenticatedApp, organization } from '../../support/authenticatedApp.fixture.mjs';
import {
  apiError, entitlements, installTeam, invitation, invitationId, invitationsRoute, member, memberId, membersRoute, ownerMember,
} from '../../support/settings.fixture.mjs';

test('invites a member, handles duplicate invitations and refreshes the list after success', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  let invitations = [];
  let conflict = true;

  installTeam(api, () => [ownerMember], () => invitations);
  api.respond('POST', invitationsRoute, ({ body }) => {
    if (conflict) return apiError(409, 'INVITATION_ALREADY_PENDING');

    const sent = invitation({ email: body.email });
    invitations = [sent];

    return success({ invitation: sent, emailQueued: true });
  });

  await page.goto('/settings?tab=team');

  const main = page.getByRole('main');

  await expect(main.getByText('Nenhum convite foi enviado ainda.', { exact: true })).toBeVisible();
  await main.getByRole('button', { name: 'Convidar membro', exact: true }).click();

  const form = main.locator('form').filter({ has: page.locator('#invite-member-email') });
  const email = form.getByLabel('E-mail *', { exact: true });
  const send = form.getByRole('button', { name: 'Enviar convite', exact: true });

  await email.fill('not-an-email');
  await send.click();
  expect(api.calls.filter((call) => call.path === invitationsRoute && call.method === 'POST')).toHaveLength(0);

  await email.fill('member@example.invalid');
  await send.click();
  await expect(form.getByRole('alert')).toHaveText('Já existe um convite pendente para esse e-mail.');

  conflict = false;
  await send.click();
  await expect(form).toBeHidden();
  await expect(main.getByText('member@example.invalid', { exact: true })).toBeVisible();
  await expect(main.getByText('Pendente', { exact: true })).toBeVisible();

  const writes = api.calls.filter((call) => call.path === invitationsRoute && call.method === 'POST');

  expect(writes).toHaveLength(2);
  expect(writes[1].body).toEqual({ email: 'member@example.invalid' });
  expect(writes[1].headers['x-csrf-token']).toBe('fixture-csrf');
});

test('resends only pending invitations and requires confirmation before revoking access', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  let current = invitation();
  const accepted = invitation({
    id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
    email: 'accepted@example.invalid',
    status: 'ACCEPTED',
    acceptedAt: date,
  });

  installTeam(api, () => [ownerMember], () => [current, accepted]);
  api.respond('POST', invitationsRoute + '/' + invitationId + '/resend', () => success({ invitation: current, emailQueued: true }));
  api.respond('DELETE', invitationsRoute + '/' + invitationId, () => {
    current = { ...current, status: 'REVOKED', revokedAt: date };

    return success(null);
  });

  await page.goto('/settings?tab=team');

  const main = page.getByRole('main');

  await expect(main.getByText('accepted@example.invalid', { exact: true })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Reenviar', exact: true })).toHaveCount(1);
  await main.getByRole('button', { name: 'Reenviar', exact: true }).click();
  await expect(main.getByText('Novo convite enviado para member@example.invalid.', { exact: true })).toBeVisible();

  await main.getByRole('button', { name: 'Revogar', exact: true }).click();
  const dialog = main.getByRole('alertdialog', { name: 'Revogar convite?' });

  await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(dialog).toBeHidden();
  expect(api.calls.filter((call) => call.method === 'DELETE')).toHaveLength(0);

  await main.getByRole('button', { name: 'Revogar', exact: true }).click();
  await dialog.getByRole('button', { name: 'Revogar convite', exact: true }).click();

  await expect(dialog).toBeHidden();
  await expect(main.getByText('Revogado', { exact: true })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Reenviar', exact: true })).toHaveCount(0);
  await expect(main.getByRole('button', { name: 'Revogar', exact: true })).toHaveCount(0);
  expect(api.calls.filter((call) => call.path === invitationsRoute + '/' + invitationId && call.method === 'DELETE')).toHaveLength(1);
});

test('disables invitations at capacity, protects the owner and refreshes membership after removal', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  let members = [ownerMember, member()];

  installTeam(api, () => members, () => [], () => entitlements({
    maxUsers: 2,
    memberCount: members.length,
    canAddMember: members.length < 2,
  }));
  api.respond('DELETE', membersRoute + '/' + memberId, () => {
    members = [ownerMember];

    return success(null);
  });

  await page.goto('/settings?tab=team');

  const main = page.getByRole('main');
  const invite = main.getByRole('button', { name: 'Convidar membro', exact: true });

  await expect(main.getByText('O limite de usuários do seu plano foi atingido.', { exact: true })).toBeVisible();
  await expect(invite).toBeDisabled();
  await expect(main.getByRole('progressbar', { name: 'Utilização de usuários do plano' })).toHaveAttribute('aria-valuenow', '2');
  await expect(main.getByRole('button', { name: 'Remover', exact: true })).toHaveCount(1);
  await main.getByRole('button', { name: 'Remover', exact: true }).click();

  const dialog = main.getByRole('alertdialog', { name: 'Remover membro?' });

  await expect(dialog).toContainText('Fixture member perderá o acesso a este negócio.');
  await dialog.getByRole('button', { name: 'Remover membro', exact: true }).click();

  await expect(dialog).toBeHidden();
  await expect(main.getByText('Fixture member', { exact: true })).toHaveCount(0);
  await expect(invite).toBeEnabled();
  await expect(main.getByRole('button', { name: 'Remover', exact: true })).toHaveCount(0);
  await expect(main.getByRole('progressbar', { name: 'Utilização de usuários do plano' })).toHaveAttribute('aria-valuenow', '1');
});

test('does not request invitations or offer membership mutations to ordinary members', async ({ page, api }) => {
  await installAuthenticatedApp(page, api, { organizations: [{ ...organization, role: 'MEMBER' }] });
  installTeam(api, () => [ownerMember, member()], () => []);

  await page.goto('/settings?tab=team');

  const main = page.getByRole('main');

  await expect(main.getByRole('heading', { name: 'Membros', exact: true })).toBeVisible();
  await expect(main.getByText('Somente o administrador do negócio pode convidar ou remover membros.', { exact: true })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Convidar membro', exact: true })).toHaveCount(0);
  await expect(main.getByRole('button', { name: 'Remover', exact: true })).toHaveCount(0);
  await expect(main.getByRole('heading', { name: 'Convites', exact: true })).toHaveCount(0);
  expect(api.calls.filter((call) => call.path === invitationsRoute)).toHaveLength(0);
});
