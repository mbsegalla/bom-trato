import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { receivableSandboxPixRecoverySchema } from './receivableSandboxPixRecovery.schema';

describe('sandbox recovery evidence', () => {
  const view = {
    organizationId: '11111111-1111-4111-8111-111111111111',
    receivableId: '22222222-2222-4222-8222-222222222222',
    issuanceId: '33333333-3333-4333-8333-333333333333',
    canRecover: true,
    nextRecoveryAt: null,
    lastWebhook: null,
    lastAttempt: {
      status: 'VERIFIED_APPROVED',
      startedAt: '2026-01-01T00:00:00Z',
      completedAt: '2026-01-01T00:00:01Z',
      paymentId: '123'
    }
  };

  it('requires a payment identity for verified evidence and forbids identity on unverified outcomes', () => {
    assert.equal(receivableSandboxPixRecoverySchema.safeParse(view).success, true);
    assert.equal(
      receivableSandboxPixRecoverySchema.safeParse({
        ...view,
        lastAttempt: {
          ...view.lastAttempt,
          paymentId: null
        }
      }).success,
      false
    );
    assert.equal(
      receivableSandboxPixRecoverySchema.safeParse({
        ...view,
        lastAttempt: {
          ...view.lastAttempt,
          status: 'NOT_FOUND'
        }
      }).success,
      false
    );
    assert.equal(receivableSandboxPixRecoverySchema.safeParse({ ...view, issuanceId: null }).success, false);
  });
});
