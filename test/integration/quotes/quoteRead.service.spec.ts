import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import { getQuote, getQuoteStatusHistory, listQuotes } from '@/modules/quotes/services/quote.service';

import { mockHttp, organizationId, receivableId, sessionResponse, success } from '../../support/http.fixture';

const route = `/api/organizations/${organizationId}/quotes`;
const date = '2025-01-01T00:00:00.000Z';

describe('quote reading contracts', () => {
  it('deduplicates equivalent list requests and preserves customer and organization filters', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path.includes('/quotes?')) return success({ items: [], page: 1, hasMore: false });
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    const params = { page: 1, limit: 10, status: 'ALL' as const };
    const first = listQuotes(organizationId, params);
    const duplicate = listQuotes(organizationId, params);

    assert.strictEqual(first, duplicate);

    await Promise.all([
      first,
      duplicate,
      listQuotes(organizationId, { ...params, status: 'SENT', customerId: receivableId }),
      listQuotes(receivableId, params),
    ]);

    const requests = calls.filter((call) => call.path.includes('/quotes?'));

    assert.equal(requests.length, 3);
    assert.ok(requests.some((call) => call.path === route + '?page=1&limit=10'));
    assert.ok(
      requests.some((call) => call.path.includes('status=SENT') && call.path.includes('customerId=' + receivableId)),
    );
    assert.ok(requests.some((call) => call.path.startsWith('/api/organizations/' + receivableId)));
  });

  it('isolates history requests by quote version and converts dates', async (t) => {
    const history = [
      {
        id: organizationId,
        quoteId: receivableId,
        fromStatus: 'DRAFT',
        toStatus: 'SENT',
        actorId: null,
        version: 2,
        createdAt: date,
      },
    ];
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path.endsWith('/status-history')) return success(history);
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    const first = getQuoteStatusHistory(organizationId, receivableId, 1);
    const duplicate = getQuoteStatusHistory(organizationId, receivableId, 1);
    const next = getQuoteStatusHistory(organizationId, receivableId, 2);

    assert.strictEqual(first, duplicate);
    assert.notStrictEqual(first, next);

    const [result] = await Promise.all([first, next]);

    assert.deepEqual(result[0].createdAt, new Date(date));
    assert.equal(calls.filter((call) => call.path.endsWith('/status-history')).length, 2);
  });

  it('clears a failed detail request and rejects malformed data', async (t) => {
    let attempts = 0;
    mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route + '/' + receivableId) {
        return ++attempts === 1 ? new Response(null, { status: 404 }) : success({ id: 'invalid' });
      }
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    await assert.rejects(getQuote(organizationId, receivableId), /não encontrado/);
    await assert.rejects(getQuote(organizationId, receivableId), /interpretar/);
    assert.equal(attempts, 2);
  });
});
