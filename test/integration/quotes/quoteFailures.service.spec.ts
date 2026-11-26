import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import {
  approveQuote,
  createQuoteShare,
  decidePublicQuote,
  downloadPublicQuotePdf,
  downloadQuotePdf,
  getQuote,
  getQuoteStatusHistory,
  listQuotes,
  requestPublicQuoteChange,
  resolvePublicQuote,
  revokeQuoteShare,
} from '@/modules/quotes/services/quote.service';

import { mockHttp, organizationId, receivableId, sessionResponse, success } from '../../support/http.fixture';

const token = 'a'.repeat(64);
const date = '2030-01-01T00:00:00Z';
const route = '/api/organizations/' + organizationId + '/quotes/' + receivableId;

describe('quote service failure and public sharing boundaries', () => {
  for (const [status, message] of [
    [400, /Confira os dados/],
    [403, /permissão/],
    [404, /não encontrado/],
    [503, /orçamentos estão sendo atualizados/],
    [500, /atualizar o status/],
  ] as const) {
    it('maps quote mutation failure ' + status + ' without repeating approval', async (t) => {
      const calls = mockHttp(t, (call) => {
        if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
        if (call.path === '/api/auth/refresh') return sessionResponse();
        return new Response(null, { status });
      });
      await restoreSession();
      await assert.rejects(approveQuote(organizationId, receivableId, 1), message);
      assert.equal(calls.filter((call) => call.path === route + '/approve').length, 1);
    });
  }

  const reads = [
    ['detail', () => getQuote(organizationId, receivableId)],
    ['list', () => listQuotes(organizationId, { page: 1, status: 'ALL' })],
    ['history', () => getQuoteStatusHistory(organizationId, receivableId, 1)],
  ] as const;

  for (const [name, operation] of reads) {
    it('clears failed ' + name + ' reads and rejects invalid data', async (t) => {
      let attempt = 0;
      const calls = mockHttp(t, (call) => {
        if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
        if (call.path === '/api/auth/refresh') return sessionResponse();
        return ++attempt === 1 ? new Response(null, { status: 503 }) : success({ invalid: true });
      });
      await restoreSession();
      await assert.rejects(operation(), /atualizados/);
      await assert.rejects(operation(), /interpretar/);
      assert.equal(calls.filter((call) => !call.path.startsWith('/api/auth/')).length, 2);
    });

    it('does not endlessly replay ' + name + ' after session expiry', async (t) => {
      const calls = mockHttp(t, (call) => {
        if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
        if (call.path === '/api/auth/refresh') return sessionResponse();
        return new Response(null, { status: 401 });
      });
      await restoreSession();
      await assert.rejects(operation(), /sessão expirou/);
      assert.equal(calls.filter((call) => !call.path.startsWith('/api/auth/')).length, 2);
    });
  }

  it('treats revoking an already removed quote link as success but reports other failures', async (t) => {
    let status = 404;
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      return new Response(null, { status });
    });
    await restoreSession();
    await revokeQuoteShare(organizationId, receivableId);
    status = 403;
    await assert.rejects(revokeQuoteShare(organizationId, receivableId), /permissão/);
    assert.equal(calls.filter((call) => call.path === route + '/share' && call.method === 'DELETE').length, 2);
  });

  it('rejects unavailable and malformed share creation responses', async (t) => {
    let attempt = 0;
    mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      return ++attempt === 1 ? new Response(null, { status: 409 }) : success({ token: 'invalid' });
    });
    await restoreSession();
    await assert.rejects(createQuoteShare(organizationId, receivableId, 1, date), /alterado/);
    await assert.rejects(createQuoteShare(organizationId, receivableId, 1, date), /interpretar/);
  });

  it('uses the fallback PDF filename when the server omits a disposition', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      return new Response('%PDF-fixture', { headers: { 'Content-Type': 'application/pdf' } });
    });
    await restoreSession();
    assert.equal((await downloadQuotePdf(organizationId, receivableId)).filename, 'orcamento.pdf');
    assert.equal((await downloadPublicQuotePdf(token)).filename, 'orcamento.pdf');
    const publicCall = calls.find((call) => call.path === '/api/public/quotes/pdf')!;
    assert.equal(publicCall.headers.has('Authorization'), false);
    assert.deepEqual(JSON.parse(String(publicCall.body)), { token });
  });

  for (const [name, operation, missing, fallback, malformed] of [
    ['resolve', () => resolvePublicQuote(token), 404, /link não está mais disponível/, /interpretar o orçamento/],
    [
      'decision',
      () => decidePublicQuote(token, 1, 'decline'),
      409,
      /já foi alterado ou decidido/,
      /interpretar a confirmação/,
    ],
    [
      'change',
      () => requestPublicQuoteChange(token, 1, 'Fixture change'),
      409,
      /já recebeu uma resposta/,
      /interpretar a confirmação/,
    ],
  ] as const) {
    it('reports a closed public ' + name + ' and rejects malformed success data', async (t) => {
      let attempt = 0;
      const calls = mockHttp(t, () =>
        ++attempt === 1 ? new Response(null, { status: missing }) : success({ invalid: true }),
      );
      await assert.rejects(operation(), fallback);
      await assert.rejects(operation(), malformed);
      assert.equal(calls.length, 2);
      assert.ok(
        calls.every(
          (call) => call.method === 'POST' && !call.headers.has('Authorization') && !call.path.includes(token),
        ),
      );
    });
  }

  for (const [name, operation, message] of [
    ['resolve', () => resolvePublicQuote(token), /carregar o orçamento/],
    ['decision', () => decidePublicQuote(token, 1, 'approve'), /registrar sua resposta/],
    ['change', () => requestPublicQuoteChange(token, 1, 'Fixture change'), /enviar sua solicitação/],
    ['pdf', () => downloadPublicQuotePdf(token), /gerar o PDF/],
  ] as const) {
    it('reports transient public ' + name + ' failures without replaying the request', async (t) => {
      const calls = mockHttp(t, () => new Response(null, { status: 500 }));
      await assert.rejects(operation(), message);
      assert.equal(calls.length, 1);
    });
  }
});
