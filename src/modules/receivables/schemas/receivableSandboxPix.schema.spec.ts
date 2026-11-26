import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createReceivableSandboxPixSchema, receivableSandboxPixSchema } from './receivableSandboxPix.schema';

describe('sandbox Pix contract', () => {
  it('does not accept production mode or reissue after a reservation', () => {
    const view = {
      organizationId: '11111111-1111-4111-8111-111111111111',
      receivableId: '22222222-2222-4222-8222-222222222222',
      receivableVersion: 1,
      available: true,
      canIssue: true,
      status: 'NOT_ISSUED',
      issuanceId: null,
      amountInCents: null,
      paymentId: null,
      expiresAt: null,
      copyAndPaste: null,
      liveMode: false
    };

    assert.equal(receivableSandboxPixSchema.safeParse(view).success, true);
    assert.equal(receivableSandboxPixSchema.safeParse({ ...view, liveMode: true }).success, false);
    assert.equal(
      receivableSandboxPixSchema.safeParse({
        ...view,
        issuanceId: '33333333-3333-4333-8333-333333333333'
      }).success,
      false
    );
  });

  it('requires sandbox consent and document length', () => {
    const input = {
      version: 1,
      testBuyerEmail: 'fixture@example.invalid',
      testDocumentType: 'CPF',
      testDocumentNumber: '19119119100',
      confirmed: true
    };

    assert.equal(createReceivableSandboxPixSchema.safeParse(input).success, true);
    assert.equal(createReceivableSandboxPixSchema.safeParse({ ...input, confirmed: false }).success, false);
    assert.equal(createReceivableSandboxPixSchema.safeParse({ ...input, testDocumentType: 'CNPJ' }).success, false);
  });
});
