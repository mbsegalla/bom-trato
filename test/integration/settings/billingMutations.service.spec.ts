import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import {
  cancelBillingSubscription,
  completePaymentMethodUpdate,
  createBillingPortal,
  resumeBillingSubscription,
  startPaymentMethodUpdate,
  syncBilling,
} from '@/modules/settings/services/billing.service';

import { mockHttp, organizationId, receivableId, sessionResponse, success } from '../../support/http.fixture';

const route = `/api/organizations/${organizationId}/billing`;

describe('billing mutation contracts', () => {
  it('uses scoped non-idempotent POST requests for billing operations and explicit card consent', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route + '/payment-method/setup')
        return success({
          updateId: receivableId,
          status: 'PENDING',
          clientSecret: 'fixture-secret',
        });
      if (call.path.endsWith('/complete'))
        return success({ updateId: receivableId, status: 'APPLIED', clientSecret: null });
      if (call.path.endsWith('/portal')) return success({ url: 'https://billing.example.invalid/portal' });
      if (call.path.startsWith(route)) return new Response(null, { status: 204 });
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    await cancelBillingSubscription(organizationId);
    await resumeBillingSubscription(organizationId);
    await syncBilling(organizationId);
    assert.equal((await startPaymentMethodUpdate(organizationId)).status, 'PENDING');
    assert.equal((await completePaymentMethodUpdate(organizationId, receivableId)).status, 'APPLIED');
    assert.equal(await createBillingPortal(organizationId), 'https://billing.example.invalid/portal');

    const requests = calls.filter((call) => call.path.startsWith(route));

    assert.deepEqual(
      requests.map((call) => call.path),
      [
        route + '/cancel',
        route + '/resume',
        route + '/sync',
        route + '/payment-method/setup',
        route + '/payment-method/updates/' + receivableId + '/complete',
        route + '/portal',
      ],
    );
    assert.ok(requests.every((call) => call.method === 'POST' && call.headers.has('Authorization')));
    assert.deepEqual(JSON.parse(String(requests[3].body)), { accepted: true });
  });

  it('does not silently retry reconciliation conflicts or accept malformed portal URLs', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path.endsWith('/sync'))
        return Response.json(
          {
            statusCode: 409,
            success: false,
            error: { code: 'BILLING_RECONCILIATION_REQUIRED', message: 'reconcile' },
          },
          { status: 409 },
        );
      if (call.path.endsWith('/portal')) return success({ url: 'not-a-url' });
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    await assert.rejects(syncBilling(organizationId), /reconciliados/);
    await assert.rejects(createBillingPortal(organizationId), /interpretar/);
    assert.equal(calls.filter((call) => call.path.startsWith(route)).length, 2);
  });
});
