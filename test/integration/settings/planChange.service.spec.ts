import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import {
  cancelPlanChange,
  confirmPlanChange,
  getRememberedPlanChange,
  previewPlanChange,
  rememberPlanChange,
  syncPlanChange,
} from '@/modules/settings/services/billing.service';

import { installBrowserStorage } from '../../support/browserStorage.fixture';
import { mockHttp, organizationId, receivableId, sessionResponse, success } from '../../support/http.fixture';

const route = `/api/organizations/${organizationId}/billing/plan-changes`;
const key = 'bom-trato:plan-change:' + organizationId;
const change = {
  id: receivableId,
  sourcePlanPriceId: organizationId,
  targetPlanPriceId: receivableId,
  mode: 'IMMEDIATE',
  status: 'QUOTED',
  currency: 'brl',
  amountDueNow: 100,
  targetAmountInCents: 500,
  targetInterval: 'MONTH',
  targetIntervalCount: 1,
  effectiveAt: null,
  quoteExpiresAt: '2030-01-01T00:00:00.000Z',
  clientSecret: null,
};

describe('plan change contracts', () => {
  it('persists only active change identifiers and removes terminal changes from the scoped browser storage', async (t) => {
    const browser = installBrowserStorage(t);
    rememberPlanChange(receivableId, organizationId);
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path.endsWith('/preview')) return success(change);
      if (call.path.endsWith('/confirm')) return success({ ...change, status: 'PENDING_PAYMENT', clientSecret: 'fixture-secret' });
      if (call.path.endsWith('/sync')) return success({ ...change, status: 'APPLIED' });
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    assert.equal((await previewPlanChange(organizationId, receivableId)).status, 'QUOTED');
    assert.equal(browser.localStorage.getItem(key), null);
    assert.equal((await confirmPlanChange(organizationId, receivableId)).status, 'PENDING_PAYMENT');
    assert.equal(browser.localStorage.getItem(key), receivableId);
    assert.equal((await syncPlanChange(organizationId, receivableId)).status, 'APPLIED');
    assert.equal(browser.localStorage.getItem(key), null);
    assert.equal(browser.localStorage.getItem('bom-trato:plan-change:' + receivableId), organizationId);

    const requests = calls.filter((call) => call.path.startsWith(route));
    assert.deepEqual(requests.map((call) => call.path), [
      route + '/preview', route + '/' + receivableId + '/confirm', route + '/' + receivableId + '/sync',
    ]);
    assert.deepEqual(JSON.parse(String(requests[0].body)), { planPriceId: receivableId });
  });

  it('forgets missing or terminal remembered changes and preserves transient failures for retry', async (t) => {
    const browser = installBrowserStorage(t);
    let attempt = 0;
    mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route + '/' + receivableId) {
        attempt++;
        if (attempt === 1) return new Response(null, { status: 503 });
        if (attempt === 2) return Response.json({
          statusCode: 404, success: false, error: { code: 'PLAN_CHANGE_NOT_FOUND', message: 'missing' },
        }, { status: 404 });
        return success({ ...change, status: 'CANCELED' });
      }
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    assert.equal(await getRememberedPlanChange(organizationId), null);
    rememberPlanChange(organizationId, receivableId);
    await assert.rejects(getRememberedPlanChange(organizationId), /atualizado/);
    assert.equal(browser.localStorage.getItem(key), receivableId);
    assert.equal(await getRememberedPlanChange(organizationId), null);
    assert.equal(browser.localStorage.getItem(key), null);

    rememberPlanChange(organizationId, receivableId);
    assert.equal((await cancelPlanChange(organizationId, receivableId)).status, 'CANCELED');
    assert.equal(browser.localStorage.getItem(key), null);
  });
});
