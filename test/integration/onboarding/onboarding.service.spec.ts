import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import { bootstrapOnboarding, getOnboarding, selectOnboardingPlan, completeBusinessSetup } from '@/modules/onboarding/services/onboarding.service';
import { mockHttp, organizationId, receivableId, issuanceId, sessionResponse, success } from '../../support/http.fixture';

const state = { step: 'SELECT_PLAN', organizationId, selectedPlanPriceId: null, accessSource: 'NONE', trialEligible: false, trial: null };

describe('onboarding HTTP service', () => {
  it('deduplicates concurrent bootstrap requests and never mixes organization state flights', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === '/api/onboarding/bootstrap') return success(state);
      if (call.path.startsWith('/api/onboarding?organizationId=')) {
        return success({ ...state, organizationId: call.path.split('=')[1] });
      }
      throw new Error('Unexpected request');
    });
    await restoreSession();
    const bootstrap = bootstrapOnboarding();
    assert.strictEqual(bootstrap, bootstrapOnboarding());
    assert.deepEqual(await bootstrap, state);
    const first = getOnboarding(organizationId);
    assert.strictEqual(first, getOnboarding(organizationId));
    const [a, b] = await Promise.all([first, getOnboarding(receivableId)]);
    assert.equal(a.organizationId, organizationId);
    assert.equal(b.organizationId, receivableId);
    assert.equal(calls.filter((call) => call.path === '/api/onboarding/bootstrap').length, 1);
    assert.equal(calls.filter((call) => call.path.startsWith('/api/onboarding?')).length, 2);
  });

  it('sends the selected organization with plan and setup changes, trusting the returned state', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === '/api/onboarding/plan') return success({ ...state, step: 'PAYMENT_PENDING', selectedPlanPriceId: issuanceId });
      if (call.path === '/api/onboarding/business') return success({ ...state, step: 'CONTACT_OWNER' });
      throw new Error('Unexpected request');
    });
    await restoreSession();
    assert.equal((await selectOnboardingPlan(organizationId, issuanceId)).step, 'PAYMENT_PENDING');
    assert.equal((await completeBusinessSetup(organizationId, 'Fixture')).step, 'CONTACT_OWNER');
    const posts = calls.filter((call) => call.path.startsWith('/api/onboarding/'));
    assert.deepEqual(posts.map((call) => JSON.parse(String(call.body))), [
      { organizationId, planPriceId: issuanceId }, { organizationId, name: 'Fixture' },
    ]);
  });
});
