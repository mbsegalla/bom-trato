import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { resolvePublicWorkOrder, PublicWorkOrderError } from '@/modules/workOrders/services/workOrderPortal.service';
import { mockHttp, success } from '../../support/http.fixture';

describe('private work order portal service', () => {
  const token = 'a'.repeat(64);

  it('rejects malformed tokens without network access and distinguishes unavailable links from retryable failures', async (t) => {
    let status = 404;
    const calls = mockHttp(t, () => new Response(null, { status }));

    await assert.rejects(resolvePublicWorkOrder('invalid'), (e: unknown) => e instanceof PublicWorkOrderError && !e.retryable);
    assert.equal(calls.length, 0);
    await assert.rejects(resolvePublicWorkOrder(token), (e: unknown) => e instanceof PublicWorkOrderError && !e.retryable);

    status = 429;

    await assert.rejects(resolvePublicWorkOrder(token), (e: unknown) => e instanceof PublicWorkOrderError && e.retryable);

    status = 503;

    await assert.rejects(resolvePublicWorkOrder(token), (e: unknown) => e instanceof PublicWorkOrderError && e.retryable);
    for (const call of calls) {
      assert.equal(call.path, '/api/public/work-orders/resolve');
      assert.deepEqual(JSON.parse(String(call.body)), { token });
      assert.equal(call.credentials, 'omit');
      assert.equal(call.cache, 'no-store');
    }
  });

  it('does not render a malformed successful portal response', async (t) => {
    mockHttp(t, () => success({ status: 'COMPLETED' }));

    await assert.rejects(resolvePublicWorkOrder(token), /interpretar/);
  });
});
