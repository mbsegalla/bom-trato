import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { listPlans } from '@/modules/plans/services/plan.service';
import { mockHttp, organizationId, receivableId, success } from '../../support/http.fixture';
const plan = { id: organizationId, code: 'fixture', name: 'Fixture', description: 'Fixture', maxUsers: 1, teamManagementEnabled: false, prices: [{ id: receivableId, amountInCents: 1000, currency: 'brl', interval: 'MONTH', intervalCount: 1 }] };
describe('plan catalogue HTTP service', () => {
  it('shares a concurrent fetch and clears the flight after success or failure', async (t) => {
    let fail = true;
    const calls = mockHttp(t, () => fail ? new Response(null, { status: 503 }) : success([plan]));
    const first = listPlans();
    assert.strictEqual(first, listPlans());
    assert.equal((await first).success, false);
    fail = false;
    assert.deepEqual(await listPlans(), { success: true, plans: [plan] });
    assert.equal(calls.length, 2);
    assert.ok(calls.every((call) => call.path === '/api/plans' && call.cache === 'no-store'));
  });
  it('rejects malformed prices instead of showing misleading plans', async (t) => {
    mockHttp(t, () => success([{ ...plan, prices: [{ ...plan.prices[0], amountInCents: -1 }] }]));
    assert.equal((await listPlans()).success, false);
  });
});
