import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession, SessionError } from '@/modules/auth/services/session.service';
import {
  acceptOrganizationInvitation,
  getTeamEntitlements,
  inviteOrganizationMember,
  listOrganizationInvitations,
  previewOrganizationInvitation,
  removeOrganizationMember,
  resendOrganizationInvitation,
  revokeOrganizationInvitation,
  TeamRequestError,
} from '@/modules/settings/services/team.service';

import { mockHttp, organizationId, receivableId, sessionResponse, success } from '../../support/http.fixture';

const route = '/api/organizations/' + organizationId;
const token = 'a'.repeat(43);
const failure = (code: string, status: number) =>
  Response.json(
    {
      statusCode: status,
      success: false,
      error: { code, message: 'private upstream detail' },
    },
    { status },
  );

describe('team permissions and failure recovery', () => {
  for (const [code, status, message] of [
    ['OWNER_REQUIRED', 403, 'Somente o administrador'],
    ['VERIFIED_USER_REQUIRED', 403, 'Confirme seu e-mail'],
    ['ALREADY_MEMBER', 409, 'já faz parte da equipe'],
    ['SUBSCRIPTION_REQUIRED', 403, 'assinatura ativa'],
    ['TEAM_MANAGEMENT_REQUIRED', 403, 'não inclui gerenciamento'],
    ['MEMBER_LIMIT_REACHED', 409, 'limite de usuários'],
    ['INVITATION_ALREADY_PENDING', 409, 'convite pendente'],
    ['INVITATION_NOT_FOUND', 404, 'convite não foi encontrado'],
    ['INVITATION_EXPIRED', 410, 'convite expirou'],
    ['INVITATION_CLOSED', 409, 'não está mais disponível'],
    ['INVITATION_EMAIL_MISMATCH', 403, 'outra conta'],
    ['INVITATION_RATE_LIMITED', 429, 'Aguarde um momento'],
    ['MEMBER_NOT_FOUND', 404, 'membro não foi encontrado'],
    ['OWNER_REMOVAL_FORBIDDEN', 403, 'não pode ser removido'],
    ['BILLING_RECONCILIATION_REQUIRED', 503, 'equipe está sendo atualizada'],
    ['TEAM_BUSY', 503, 'equipe está sendo atualizada'],
  ] as const) {
    it('preserves the team error ' + code, async (t) => {
      const calls = mockHttp(t, (call) => {
        if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
        if (call.path === '/api/auth/refresh') return sessionResponse();
        return failure(code, status);
      });
      await restoreSession();
      await assert.rejects(
        inviteOrganizationMember(organizationId, 'member@example.invalid'),
        (error: unknown) =>
          error instanceof TeamRequestError &&
          error.code === code &&
          error.status === status &&
          error.message.includes(message) &&
          !error.message.includes('private upstream detail'),
      );
      assert.equal(calls.filter((call) => call.path === route + '/invitations').length, 1);
    });
  }

  for (const [status, message] of [
    [403, 'não tem permissão'],
    [404, 'recurso solicitado não foi encontrado'],
    [429, 'Muitas solicitações'],
    [500, 'Não foi possível enviar o convite'],
  ] as const) {
    it('uses a safe fallback for malformed HTTP ' + status, async (t) => {
      mockHttp(t, (call) => {
        if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
        if (call.path === '/api/auth/refresh') return sessionResponse();
        return new Response('not JSON', { status });
      });
      await restoreSession();
      await assert.rejects(
        inviteOrganizationMember(organizationId, 'member@example.invalid'),
        (error: unknown) =>
          error instanceof TeamRequestError &&
          error.code === null &&
          error.status === status &&
          error.message.includes(message),
      );
    });
  }

  const operations = [
    ['list invitations', () => listOrganizationInvitations(organizationId)],
    ['entitlements', () => getTeamEntitlements(organizationId)],
    ['invite', () => inviteOrganizationMember(organizationId, 'member@example.invalid')],
    ['resend', () => resendOrganizationInvitation(organizationId, receivableId)],
    ['revoke', () => revokeOrganizationInvitation(organizationId, receivableId)],
    ['remove', () => removeOrganizationMember(organizationId, receivableId)],
    ['preview', () => previewOrganizationInvitation(token)],
    ['accept', () => acceptOrganizationInvitation(token)],
  ] as const;

  for (const [name, operation] of operations) {
    it('does not implicitly retry ' + name + ' after a conflict', async (t) => {
      const calls = mockHttp(t, (call) => {
        if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
        if (call.path === '/api/auth/refresh') return sessionResponse();
        return failure('TEAM_BUSY', 503);
      });
      await restoreSession();
      await assert.rejects(
        operation(),
        (error: unknown) => error instanceof TeamRequestError && error.code === 'TEAM_BUSY',
      );
      assert.equal(calls.filter((call) => !call.path.startsWith('/api/auth/')).length, 1);
    });

    if (name === 'revoke' || name === 'remove') continue;
    it('rejects malformed success data for ' + name, async (t) => {
      mockHttp(t, (call) => {
        if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
        if (call.path === '/api/auth/refresh') return sessionResponse();
        return success({ invalid: true });
      });
      await restoreSession();
      await assert.rejects(operation(), /interpretar/);
    });
  }

  it('discards partial invitation results after a failed page and starts a fresh listing', async (t) => {
    let fail = true;
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      const page = Number(new URLSearchParams(call.path.split('?')[1]).get('page'));
      if (page === 2 && fail) return failure('TEAM_BUSY', 503);
      return success({ page, hasMore: page === 1, items: [] });
    });
    await restoreSession();
    await assert.rejects(listOrganizationInvitations(organizationId), /equipe está sendo atualizada/);
    fail = false;
    assert.deepEqual(await listOrganizationInvitations(organizationId), []);
    assert.deepEqual(
      calls
        .filter((call) => call.path.includes('/invitations?'))
        .map((call) => new URLSearchParams(call.path.split('?')[1]).get('page')),
      ['1', '2', '1', '2'],
    );
  });

  it('surfaces session expiry after exactly one replay', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      return new Response(null, { status: 401 });
    });
    await restoreSession();
    await assert.rejects(getTeamEntitlements(organizationId), (error: unknown) => error instanceof SessionError);
    assert.equal(calls.filter((call) => call.path.endsWith('/entitlements')).length, 2);
  });
});
