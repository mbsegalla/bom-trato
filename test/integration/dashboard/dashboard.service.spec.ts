import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import { getDashboard } from '@/modules/dashboard/services/dashboard.service';

import { mockHttp, organizationId, receivableId, sessionResponse, success } from '../../support/http.fixture';

describe('dashboard HTTP aggregation', () => {
  it('keeps concurrent dashboard reads isolated by tenant and deduplicates identical requests', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      const url = new URL(call.path, 'https://api.example.invalid');
      const generatedAt = '2026-01-01T00:00:00Z';
      const period = { from: url.searchParams.get('from'), to: url.searchParams.get('to') };
      if (url.pathname.endsWith('/summary'))
        return success({
          generatedAt,
          period,
          quotes: {
            draft: 0,
            awaitingApproval: 0,
            expiredSent: 0,
          },
          workOrders: {
            open: 0,
            scheduled: 0,
            inProgress: 0,
            completedInPeriod: 0,
          },
        });
      if (url.pathname.endsWith('/financial'))
        return success({
          generatedAt,
          period,
          currency: 'brl',
          currentReceivables: {
            pendingCount: 0,
            pendingAmountInCents: 0,
            overdueCount: 0,
            overdueAmountInCents: 0,
          },
          periodReceipts: {
            count: 1,
            amountInCents: call.path.includes(organizationId) ? 1001 : 2002,
          },
        });
      if (url.pathname.endsWith('/financial-trend'))
        return success({
          generatedAt,
          period,
          currency: 'brl',
          items: [],
        });

      return success({ generatedAt, items: [], hasMore: false });
    });

    await restoreSession();
    const first = getDashboard(organizationId);

    assert.strictEqual(first, getDashboard(organizationId));

    const [a, b] = await Promise.all([first, getDashboard(receivableId)]);

    assert.equal(a.financial.periodReceipts.amountInCents, 1001);
    assert.equal(b.financial.periodReceipts.amountInCents, 2002);
    assert.equal(calls.filter((call) => call.path.includes('/dashboard/')).length, 8);
  });

  it('releases failed flights instead of keeping rejected dashboard data cached', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();

      return new Response(null, { status: 503 });
    });

    await restoreSession();

    await assert.rejects(getDashboard(organizationId), /carregar/);
    await assert.rejects(getDashboard(organizationId), /carregar/);
    assert.equal(calls.filter((call) => call.path.includes('/dashboard/')).length, 8);
  });
});
