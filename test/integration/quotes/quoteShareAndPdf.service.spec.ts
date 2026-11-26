import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import { createQuoteShare, downloadQuotePdf, revokeQuoteShare } from '@/modules/quotes/services/quote.service';

import { mockHttp, organizationId, receivableId, sessionResponse, success } from '../../support/http.fixture';

const route = `/api/organizations/${organizationId}/quotes/${receivableId}`;
const expiresAt = '2030-01-01T00:00:00.000Z';

describe('private quote share and PDF contracts', () => {
  it('downloads PDF bytes and uses the supplied filename or a stable fallback', async (t) => {
    let attempt = 0;
    mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route + '/pdf') {
        return new Response('%PDF-fixture', {
          headers: ++attempt === 1 ? { 'content-disposition': 'attachment; filename="quote.pdf"' } : {},
        });
      }
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    const first = await downloadQuotePdf(organizationId, receivableId);
    const second = await downloadQuotePdf(organizationId, receivableId);

    assert.equal(first.filename, 'quote.pdf');
    assert.equal(await first.blob.text(), '%PDF-fixture');
    assert.equal(second.filename, 'orcamento.pdf');
  });

  it('creates a versioned share and tolerates revocation of an already absent share', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route + '/share' && call.method === 'POST') {
        return success({ id: receivableId, url: 'https://app.example.invalid/share', quoteVersion: 4, expiresAt });
      }
      if (call.path === route + '/share' && call.method === 'DELETE') return new Response(null, { status: 404 });
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    const share = await createQuoteShare(organizationId, receivableId, 4, expiresAt);
    await revokeQuoteShare(organizationId, receivableId);

    assert.equal(share.quoteVersion, 4);
    assert.deepEqual(share.expiresAt, new Date(expiresAt));
    const requests = calls.filter((call) => call.path === route + '/share');
    assert.deepEqual(requests.map((call) => call.method), ['POST', 'DELETE']);
    assert.deepEqual(JSON.parse(String(requests[0].body)), { version: 4, expiresAt });
  });

  it('rejects forbidden downloads, share creation and revocation', async (t) => {
    mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path.startsWith(route)) return new Response(null, { status: 403 });
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    await assert.rejects(downloadQuotePdf(organizationId, receivableId), /permissão/);
    await assert.rejects(createQuoteShare(organizationId, receivableId, 4, expiresAt), /permissão/);
    await assert.rejects(revokeQuoteShare(organizationId, receivableId), /permissão/);
  });
});
