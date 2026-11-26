import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import {
  BillingRequestError,
  getBillingEntitlements,
  getBillingPaymentMethod,
  getBillingSubscription,
  listBillingInvoices,
} from '@/modules/settings/services/billing.service';

import { mockHttp, organizationId, receivableId, sessionResponse, success } from '../../support/http.fixture';

const route = `/api/organizations/${organizationId}/billing`;

describe('billing read contracts', () => {
  it('deduplicates subscription reads without sharing data across organizations', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path.endsWith('/subscription')) return success(null);
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    const first = getBillingSubscription(organizationId);
    const duplicate = getBillingSubscription(organizationId);
    const other = getBillingSubscription(receivableId);

    assert.strictEqual(first, duplicate);
    assert.notStrictEqual(first, other);
    assert.deepEqual(await Promise.all([first, duplicate, other]), [null, null, null]);
    assert.equal(calls.filter((call) => call.path.endsWith('/subscription')).length, 2);
  });

  it('preserves invoice cursors and separates invoice requests by organization', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path.includes('/invoices?')) return success({ items: [], nextCursor: 'next' });
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    const first = listBillingInvoices(organizationId, 'a+b');
    const duplicate = listBillingInvoices(organizationId, 'a+b');
    const next = listBillingInvoices(organizationId, 'next');

    assert.strictEqual(first, duplicate);

    await Promise.all([first, duplicate, next, listBillingInvoices(receivableId, 'a+b')]);

    const requests = calls.filter((call) => call.path.includes('/invoices?'));
    assert.equal(requests.length, 3);
    assert.ok(requests.some((call) => call.path.startsWith(route) && new URLSearchParams(call.path.split('?')[1]).get('cursor') === 'a+b'));
  });

  it('rejects malformed cards and surfaces typed permission errors without retaining failed flights', async (t) => {
    let attempts = 0;
    mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path.endsWith('/payment-method')) {
        attempts++;
        if (attempts === 1) return success({ brand: 'visa', last4: '123', expMonth: 13, expYear: 2030 });
        if (attempts === 2) return Response.json({
          statusCode: 403, success: false, error: { code: 'OWNER_REQUIRED', message: 'owner required' },
        }, { status: 403 });
        return success({ brand: 'visa', last4: '4242', expMonth: 12, expYear: 2030 });
      }
      if (call.path.endsWith('/entitlements')) return success({
        hasAccess: true, maxUsers: 2, memberCount: 2, teamManagementEnabled: true, canAddMember: false,
      });
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    await assert.rejects(getBillingPaymentMethod(organizationId), /interpretar/);
    await assert.rejects(getBillingPaymentMethod(organizationId), (error: unknown) =>
      error instanceof BillingRequestError && error.status === 403 && error.code === 'OWNER_REQUIRED',
    );
    assert.equal((await getBillingPaymentMethod(organizationId))?.last4, '4242');
    assert.equal((await getBillingEntitlements(organizationId)).canAddMember, false);
  });
});
