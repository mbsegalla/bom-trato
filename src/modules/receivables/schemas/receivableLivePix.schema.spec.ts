import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createReceivableLivePixSchema, receivableLivePixSchema } from './receivableLivePix.schema';

const view = {
  organizationId: '11111111-1111-4111-8111-111111111111',
  receivableId: '22222222-2222-4222-8222-222222222222',
  issuanceId: '33333333-3333-4333-8333-333333333333',
  receivableVersion: 1,
  available: true,
  canIssue: false,
  canRecover: true,
  status: 'PENDING',
  amountInCents: 100,
  paymentId: '123456',
  expiresAt: '2026-01-01T12:00:00Z',
  copyAndPaste: '000201TEST6304ABCD',
  liveMode: true,
  reviewCode: null,
  lastRecoveryCode: null,
  nextRecoveryAt: null,
  lastWebhookCode: null,
};

describe('live Pix contract', () => {
  it('accepts only complete live pending views and parses expiry', () => {
    assert.equal(receivableLivePixSchema.parse(view).expiresAt?.toISOString(), '2026-01-01T12:00:00.000Z');

    for (const patch of [
      { liveMode: false },
      { paymentId: null },
      { amountInCents: 0 },
      { copyAndPaste: null },
      { available: false },
      { canIssue: true },
    ])
      assert.equal(receivableLivePixSchema.safeParse({ ...view, ...patch }).success, false);
  });

  it('never accepts a QR in a settled, expired or review state', () => {
    for (const status of ['SETTLED', 'EXPIRED', 'REVIEW_REQUIRED', 'STALE', 'CLOSED']) {
      assert.equal(receivableLivePixSchema.safeParse({ ...view, status }).success, false);
      assert.equal(
        receivableLivePixSchema.safeParse({
          ...view,
          status,
          copyAndPaste: null,
          expiresAt: null,
        }).success,
        true,
      );
    }
  });

  it('requires explicit real-payment consent and matching document length', () => {
    const input = {
      version: 1,
      buyerEmail: 'fixture@example.invalid',
      buyerDocumentType: 'CPF',
      buyerDocumentNumber: '19119119100',
      confirmed: true,
    };

    assert.equal(createReceivableLivePixSchema.safeParse(input).success, true);

    for (const patch of [{ confirmed: false }, { buyerDocumentType: 'CNPJ' }, { version: 0 }, { buyerEmail: 'bad' }])
      assert.equal(createReceivableLivePixSchema.safeParse({ ...input, ...patch }).success, false);
  });
});
