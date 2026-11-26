import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import {
  getReceivableLivePix,
  issueReceivableLivePix,
  recoverReceivableLivePix
} from '@/modules/receivables/services/receivableLivePix.service';

import {
  issuanceId,
  mockHttp,
  organizationId,
  receivableId,
  sessionResponse,
  success
} from '../../support/http.fixture';

const route = '/api/organizations/' + organizationId + '/receivables/' + receivableId + '/mercado-pago/live-pix';
const view = {
  organizationId,
  receivableId,
  receivableVersion: 1,
  available: true,
  canIssue: false,
  canRecover: true,
  status: 'REVIEW_REQUIRED',
  issuanceId,
  amountInCents: 100,
  paymentId: null,
  expiresAt: null,
  copyAndPaste: null,
  reviewCode: 'UNCERTAIN_CREATION',
  lastRecoveryCode: null,
  nextRecoveryAt: null,
  lastWebhookCode: null,
  liveMode: true,
};
const issue = {
  version: 1,
  buyerEmail: 'fixture@example.invalid',
  buyerDocumentType: 'CPF' as const,
  buyerDocumentNumber: '19119119100',
  confirmed: true as const
};

describe('live Pix HTTP service', () => {
  it('uses the scoped recovery endpoint and immutable issuance, not a new create request', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route + '/recovery') return success(view);
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();
    const result = await recoverReceivableLivePix(organizationId, receivableId, issuanceId);

    assert.equal(result.issuanceId, issuanceId);

    const request = calls.at(-1)!;

    assert.equal(request.method, 'POST');
    assert.deepEqual(JSON.parse(String(request.body)), { issuanceId });
    assert.equal(request.headers.get('Authorization'), 'Bearer fixture-access');
    assert.equal(request.headers.get('X-CSRF-Token'), 'fixture-csrf');
  });

  it('rejects data for another organization or sandbox mode', async (t) => {
    let response = { ...view, organizationId: receivableId };
    mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route) return success(response);
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    await assert.rejects(getReceivableLivePix(organizationId, receivableId), /interpretar/);

    response = { ...view, liveMode: false };

    await assert.rejects(getReceivableLivePix(organizationId, receivableId), /interpretar/);
  });

  it('does not retry a conflict or uncertain provider response with another issuance POST', async (t) => {
    let status = 409;
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route) return new Response(null, { status });
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    await assert.rejects(issueReceivableLivePix(organizationId, receivableId, issue), /alterada/);
    assert.equal(calls.filter((call) => call.path === route).length, 1);

    status = 503;

    await assert.rejects(issueReceivableLivePix(organizationId, receivableId, issue), /não gere outra cobrança/);

    const requests = calls.filter((call) => call.path === route);

    assert.equal(requests.length, 2);
    assert.equal(requests[1].method, 'POST');
    assert.deepEqual(JSON.parse(String(requests[1].body)), issue);
  });
});
